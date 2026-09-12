import { useEffect, useState } from "react";

import { cx } from "@/lib/cx";
import { APP_URL, PRO_URL, SECTIONS } from "@/lib/links";
import { BrandLogo } from "./BrandLogo";
import { Action } from "./primitives";

/* A barra. É a peça mais funcional da página inteira.

   O domínio raiz é a porta de entrada dos DOIS públicos, e é aqui que essa
   decisão se resolve. Por isso as duas ações são permanentes e visíveis em
   qualquer largura, inclusive em 320px: nenhuma delas entra em menu
   sanfonado. O que some no telefone é o índice das seções — que é navegação
   de leitura, não porta de entrada.

   A hierarquia entre as duas é deliberada e segue o §15: "Entrar" é o fill
   de contraste máximo, porque o usuário é o volume; "Sou profissional" é o
   contorno, porque é a porta minoritária mas não pode parecer secundária a
   ponto de ser procurada. Contorno e fill têm o mesmo peso tipográfico e a
   mesma altura — a diferença é de superfície, não de importância. */

export function Nav() {
  /* A barra nasce transparente sobre o WebGL e ganha fundo assim que a
     rolagem começa: sem isso o texto dela cruza o miolo claro de um orbe e
     perde contraste. O limiar é baixo de propósito — o fundo precisa estar
     lá antes de a primeira linha de texto passar por baixo. */
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const onScroll = () => setSettled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* §29 — o primeiro tab de quem usa teclado pula a barra inteira. */}
      <a
        href="#conteudo"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-sm focus-visible:bg-action focus-visible:px-4 focus-visible:py-2 focus-visible:text-ui focus-visible:font-semibold focus-visible:text-on-action"
      >
        Ir para o conteúdo
      </a>

      <header
        className={cx(
          "fixed inset-x-0 top-0 z-40 transition-colors duration-[--duration-ui] ease-[--ease-enter]",
          settled
            ? "border-b border-hairline bg-ambient/68 backdrop-blur-xl"
            : "border-b border-transparent",
        )}
      >
        <div className="frame flex h-16 items-center gap-1.5 sm:h-18 sm:gap-8">
          <a
            href="#topo"
            aria-label="Siouve — início"
            className="shrink-0 rounded-xs transition-opacity duration-[--duration-fast] hover:opacity-80"
          >
            <BrandLogo className="text-[1.08rem] min-[370px]:text-[1.2rem] sm:text-[1.6rem]" />
          </a>

          {/* Índice de leitura. É navegação interna: pode sumir no telefone,
              onde a rolagem já é o índice. */}
          <nav aria-label="Seções desta página" className="hidden flex-1 lg:block">
            <ul className="flex items-center gap-7">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="type-meta group flex items-center gap-2 text-tertiary transition-colors duration-[--duration-fast] hover:text-primary"
                  >
                    <span className="text-hairline-strong transition-colors duration-[--duration-fast] group-hover:text-accent-lavender">
                      {section.index}
                    </span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
            <Action href={PRO_URL} variant="outline" size="sm" className="h-9 px-2 text-[0.7rem] sm:h-11 sm:px-5 sm:text-ui">
              {/* O rótulo curto existe só abaixo de `sm`, onde "Sou
                  profissional" empurraria o "Entrar" para fora da tela. O
                  aria-label mantém o nome completo para quem não vê o
                  layout. */}
              <span aria-hidden="true" className="sm:hidden">
                Profissional
              </span>
              <span className="hidden sm:inline">Sou profissional</span>
              <span className="sr-only sm:hidden">Sou profissional</span>
            </Action>

            <Action href={APP_URL} size="sm" className="h-9 px-2.5 text-[0.7rem] sm:h-11 sm:px-6 sm:text-ui">
              Entrar
            </Action>
          </div>
        </div>
      </header>
    </>
  );
}
