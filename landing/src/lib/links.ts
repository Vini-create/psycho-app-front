/* Os destinos públicos da plataforma.

   A landing é a porta de entrada: ela mora no domínio raiz e não hospeda
   nem login nem cadastro — ela encaminha. Os endereços ficam num módulo só
   para que "Entrar" signifique a mesma coisa no topo, no meio e no rodapé.

   Os antigos endereços `workers.dev` não aparecem em link público. */

export const APP_URL = "https://app.siouve.com";
export const PRO_URL = "https://pro.siouve.com";

export const SECTIONS = [
  { id: "intervalo", index: "01", label: "O intervalo" },
  { id: "quem-somos", index: "02", label: "Quem somos" },
  { id: "oferecemos", index: "03", label: "O que oferecemos" },
  { id: "portas", index: "04", label: "Por onde entrar" },
] as const;
