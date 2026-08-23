/* Brand Book V2 §20 — "Nunca mostre user-agent cru como principal
   identificação. Converta tecnicamente para algo compreensível."

   A tela de sessões existe para uma pergunta só: "sou eu nesse aparelho?".
   Uma string como

     Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15
     (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1

   não responde essa pergunta — ela obriga a pessoa a fazer parsing mental
   justamente no momento em que precisa decidir se desconecta um acesso
   desconhecido. Isso é falha de segurança por design de interface.

   O detalhe técnico continua acessível, em expansão secundária. */

export interface DeviceDescription {
  /** "iPhone · Safari". O que a pessoa lê primeiro. */
  label: string;
  /** Plataforma isolada, quando reconhecida. */
  platform: string | null;
  /** Navegador isolado, quando reconhecido. */
  browser: string | null;
}

/* A ordem importa: quase todo user-agent mente por compatibilidade
   histórica. Edge se declara Chrome, Chrome se declara Safari, e o Safari
   de verdade se declara Mozilla. Testar do mais específico para o mais
   genérico é o que evita chamar Edge de Chrome. */

const PLATFORMS: Array<[RegExp, string]> = [
  [/iPhone/i, "iPhone"],
  [/iPad/i, "iPad"],
  [/Android/i, "Android"],
  [/Windows NT/i, "Windows"],
  [/Macintosh|Mac OS X/i, "Mac"],
  [/CrOS/i, "ChromeOS"],
  [/Linux/i, "Linux"],
];

const BROWSERS: Array<[RegExp, string]> = [
  [/Edg[eA]?\//i, "Edge"],
  [/OPR\/|Opera/i, "Opera"],
  [/SamsungBrowser/i, "Samsung Internet"],
  [/Firefox\/|FxiOS/i, "Firefox"],
  [/CriOS/i, "Chrome"],
  [/Chrome\//i, "Chrome"],
  [/Safari\//i, "Safari"],
];

/**
 * Traduz um user-agent para uma identificação legível.
 *
 * Devolve `label` já pronto para exibição — nunca uma string vazia, e nunca
 * o user-agent cru como rótulo principal.
 */
export function describeDevice(userAgent: string | null | undefined): DeviceDescription {
  const raw = (userAgent ?? "").trim();

  if (!raw) {
    return { label: "Aparelho não identificado", platform: null, browser: null };
  }

  const platform = PLATFORMS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;
  const browser = BROWSERS.find(([pattern]) => pattern.test(raw))?.[1] ?? null;

  if (platform && browser) {
    return { label: `${platform} · ${browser}`, platform, browser };
  }

  // Um dos dois já é melhor que a string crua; nenhum dos dois significa
  // que é um cliente que não conhecemos, e aí dizer isso é mais honesto
  // do que despejar 180 caracteres de cabeçalho HTTP na tela.
  return {
    label: platform ?? browser ?? "Aparelho não identificado",
    platform,
    browser,
  };
}
