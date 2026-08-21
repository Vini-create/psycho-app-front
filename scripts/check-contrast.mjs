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

// Primitivos + semânticos do light vivem nos dois primeiros `:root`.
const primitives = parseTokens(blockAfter("/* --------------------------------------------------------------------------\n   1. Primitivos"));
const light = { ...primitives, ...parseTokens(blockAfter("   2. Semânticos — light mode")) };
const dark = { ...primitives, ...parseTokens(blockAfter(':root[data-theme="dark"]')) };

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

/** [primeiro plano, fundo, mínimo exigido, descrição] */
const PAIRS = [
  ["text-primary", "bg-canvas", 4.5, "texto principal sobre o fundo"],
  ["text-primary", "bg-surface", 4.5, "texto principal sobre card"],
  ["text-primary", "bg-subtle", 4.5, "texto principal sobre área secundária"],
  ["text-primary", "surface-brand", 4.5, "texto sobre superfície de marca"],
  ["text-secondary", "bg-canvas", 4.5, "texto de apoio sobre o fundo"],
  ["text-secondary", "bg-surface", 4.5, "texto de apoio sobre card"],
  ["text-brand", "bg-surface", 4.5, "link e destaque sobre card"],
  ["text-brand", "bg-canvas", 4.5, "link e destaque sobre o fundo"],
  ["action-on-primary", "action-primary", 4.5, "label do botão primário"],
  ["border-control", "bg-surface", 3.0, "borda de campo sobre card"],
  ["focus-ring", "bg-canvas", 3.0, "anel de foco sobre o fundo"],
  ["focus-ring", "bg-surface", 3.0, "anel de foco sobre card"],
  ["success-fg", "success-bg", 4.5, "estado de sucesso"],
  ["warning-fg", "warning-bg", 4.5, "estado de atenção"],
  ["danger-fg", "danger-bg", 4.5, "estado de erro"],
  ["info-fg", "info-bg", 4.5, "estado de informação"],
  ["text-on-inverse", "bg-inverse", 4.5, "texto sobre bloco invertido"],
  ["text-on-inverse-muted", "bg-inverse", 4.5, "texto de apoio sobre bloco invertido"],
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

console.log(
  failures === 0
    ? "\n  Todos os pares passam na WCAG 2.2 AA.\n"
    : `\n  ${failures} par(es) reprovado(s).\n`,
);

process.exit(failures === 0 ? 0 : 1);
