#!/usr/bin/env node
/**
 * Valida os pares de cor do design system contra a WCAG 2.2 AA.
 *
 * Contraste é requisito, não polimento — e olho humano é péssimo medidor.
 * Este script lê os tokens direto do CSS, então ele não pode divergir
 * do que a aplicação realmente usa.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, "../packages/ui/src/styles/tokens.css");
const css = readFileSync(cssPath, "utf8");

/** Extrai `--nome: #hex` de um trecho de CSS. */
function parseTokens(block) {
  const tokens = {};
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

function blockAfter(marker) {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`Bloco não encontrado: ${marker}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open, i);
    }
  }
  throw new Error(`Bloco não fechado: ${marker}`);
}

function blockAfterLast(marker) {
  const start = css.lastIndexOf(marker);
  if (start === -1) throw new Error(`Bloco não encontrado: ${marker}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open, i);
    }
  }
  throw new Error(`Bloco não fechado: ${marker}`);
}

// Primitivos + semânticos do light vivem nos dois primeiros `:root`.
const primitives = parseTokens(blockAfter("/* --------------------------------------------------------------------------\n   1. Primitivos"));
const light = { ...primitives, ...parseTokens(blockAfter("   2. Semânticos — light")) };
const dark = { ...primitives, ...parseTokens(blockAfter(':root[data-theme="dark"]')) };
const folderToneCommon = parseTokens(blockAfter('[data-folder-tone="sage"],'));
const folderSheets = ["sage", "lavender", "clay"].map((tone) => [
  `folha ${tone}`,
  {
    ...dark,
    ...folderToneCommon,
    ...parseTokens(blockAfterLast(`[data-folder-tone="${tone}"] {`)),
  },
]);

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function mixSrgb(foreground, background, amount) {
  const channels = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const fg = channels(foreground);
  const bg = channels(background);
  const mixed = fg.map((value, index) =>
    Math.round(value * amount + bg[index] * (1 - amount)),
  );
  return `#${mixed.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

/** [primeiro plano, fundo, mínimo exigido, descrição] */
const PAIRS = [
  // Leitura sobre as superfícies neutras
  ["text-primary", "surface-page", 4.5, "texto principal sobre a página"],
  ["text-primary", "surface-raised", 4.5, "texto principal sobre superfície elevada"],
  ["text-primary", "surface-sunken", 4.5, "texto principal sobre superfície recuada"],
  ["text-primary", "surface-inset", 4.5, "texto principal sobre superfície embutida"],
  ["text-secondary", "surface-page", 4.5, "texto de apoio sobre a página"],
  ["text-secondary", "surface-raised", 4.5, "texto de apoio sobre superfície elevada"],
  ["text-secondary", "surface-sunken", 4.5, "texto de apoio sobre superfície recuada"],
  // Navegação em pasta: a aba ativa tem superfície própria; as inativas
  // repousam no trilho.
  ["text-primary", "surface-tab", 4.5, "rótulo da aba ativa"],
  ["text-secondary", "surface-tab", 4.5, "metadata sobre a aba ativa"],
  ["text-secondary", "surface-rail", 4.5, "aba inativa sobre o trilho"],
  ["text-tertiary", "surface-rail", 3.0, "ícone da aba inativa sobre o trilho"],
  ["text-accent", "surface-tab", 3.0, "ícone da aba ativa"],
  ["text-tertiary", "surface-page", 4.5, "metadata sobre a página"],
  ["text-accent", "surface-page", 4.5, "acento sobre a página"],
  ["text-accent", "surface-raised", 4.5, "acento sobre superfície elevada"],

  // Ação
  ["text-on-action", "action-primary", 4.5, "label do botão primário"],
  ["text-on-action", "action-primary-hover", 4.5, "label do botão primário em hover"],

  // Texto sobre cada painel pastel. Um painel só entra no sistema se o
  // corpo de texto continuar legível sobre ele — brandbook §04.
  ["text-on-panel", "panel-lavender", 4.5, "texto sobre painel lavender"],
  ["text-on-panel", "panel-sage", 4.5, "texto sobre painel sage"],
  ["text-on-panel", "panel-clay", 4.5, "texto sobre painel clay"],
  ["text-on-panel", "panel-apricot", 4.5, "texto sobre painel apricot"],
  ["text-on-panel", "panel-ochre", 4.5, "texto sobre painel ochre"],
  ["text-on-panel", "panel-fogblue", 4.5, "texto sobre painel fog blue"],
  ["text-on-panel", "panel-dustrose", 4.5, "texto sobre painel dust rose"],
  ["text-on-panel-muted", "panel-lavender", 4.5, "metadata sobre painel lavender"],
  ["text-on-panel-muted", "panel-fogblue", 4.5, "metadata sobre painel fog blue"],
  ["text-on-panel-muted", "panel-clay", 4.5, "metadata sobre painel clay"],
  ["text-on-panel", "surface-message-user", 4.5, "texto na mensagem da pessoa"],

  // Tintas pastel carregando texto sobre a página
  ["ink-lavender", "surface-page", 4.5, "tinta lavender sobre a página"],
  ["ink-sage", "surface-page", 4.5, "tinta sage sobre a página"],
  ["ink-clay", "surface-page", 4.5, "tinta clay sobre a página"],
  ["ink-apricot", "surface-page", 4.5, "tinta apricot sobre a página"],
  ["ink-ochre", "surface-page", 4.5, "tinta ochre sobre a página"],
  ["ink-fogblue", "surface-page", 4.5, "tinta fog blue sobre a página"],
  ["ink-dustrose", "surface-page", 4.5, "tinta dust rose sobre a página"],

  // Estados operacionais — cor sempre acompanhada de rótulo, mas ainda
  // assim precisa passar sozinha.
  ["status-positive", "status-positive-surface", 4.5, "estado positivo"],
  ["status-notice", "status-notice-surface", 4.5, "estado de atenção"],
  ["status-info", "status-info-surface", 4.5, "estado informativo"],
  ["status-destructive", "status-destructive-surface", 4.5, "estado destrutivo"],
  ["status-destructive", "surface-page", 4.5, "ação destrutiva sobre a página"],

  // Estrutura: bordas e foco respondem ao mínimo 3:1 de componente gráfico.
  ["border-control", "surface-raised", 3.0, "borda de campo sobre superfície elevada"],
  ["border-control", "surface-page", 3.0, "borda de campo sobre a página"],
  ["border-focus", "surface-page", 3.0, "anel de foco sobre a página"],
  ["border-focus", "surface-raised", 3.0, "anel de foco sobre superfície elevada"],
  ["border-strong", "surface-page", 3.0, "borda forte sobre a página"],

  // Bloco invertido
  ["text-inverse", "surface-inverse", 4.5, "texto sobre bloco invertido"],
  ["text-inverse-muted", "surface-inverse", 4.5, "metadata sobre bloco invertido"],
];

let failures = 0;

for (const [themeName, tokens] of [
  ["light", light],
  ["dark", dark],
]) {
  console.log(`\n  ${themeName.toUpperCase()}`);
  for (const [fg, bg, min, description] of PAIRS) {
    const fgHex = tokens[fg];
    const bgHex = tokens[bg];
    if (!fgHex || !bgHex) {
      console.log(`  ?  ${fg} / ${bg} — token ausente no tema ${themeName}`);
      failures += 1;
      continue;
    }
    const ratio = contrast(fgHex, bgHex);
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? "ok" : "XX"}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${description}`,
    );
  }
}

const NAV_DESCRIPTIONS = new Set([
  "rótulo da aba ativa",
  "metadata sobre a aba ativa",
  "aba inativa sobre o trilho",
  "ícone da aba inativa sobre o trilho",
  "ícone da aba ativa",
]);
const SHEET_PAIRS = PAIRS.filter(([, , , description]) =>
  !NAV_DESCRIPTIONS.has(description),
);

for (const [themeName, tokens] of folderSheets) {
  console.log(`\n  ${themeName.toUpperCase()}`);
  for (const [fg, bg, min, description] of SHEET_PAIRS) {
    const ratio = contrast(tokens[fg], tokens[bg]);
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? "ok" : "XX"}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${description}`,
    );
  }
}

console.log("\n  FOLDERS COLORIDAS");
for (const [name, fillToken, activeInkToken, inactiveInkToken] of [
  ["dark", "folder-dark", "folder-ink-dark", "folder-muted-dark"],
  ["sage", "folder-sage", "folder-ink-pastel", "folder-muted-pastel"],
  ["lavender", "folder-lavender", "folder-ink-pastel", "folder-muted-pastel"],
  ["clay", "folder-clay", "folder-ink-pastel", "folder-muted-pastel"],
]) {
  const fill = primitives[fillToken];
  const activeInk = primitives[activeInkToken];
  const inactiveInk = primitives[inactiveInkToken];
  const rail = dark["surface-rail"];
  const inactiveFill = mixSrgb(fill, rail, 0.38);
  const checks = [
    [contrast(activeInk, fill), 4.5, `${name}: rótulo na pasta ativa`],
    [contrast(inactiveInk, inactiveFill), 4.5, `${name}: rótulo na pasta inativa`],
  ];

  for (const [ratio, min, description] of checks) {
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? "ok" : "XX"}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${description}`,
    );
  }
}

console.log(
  failures === 0
    ? "\n  Todos os pares passam na WCAG 2.2 AA.\n"
    : `\n  ${failures} par(es) reprovado(s).\n`,
);

process.exit(failures === 0 ? 0 : 1);
