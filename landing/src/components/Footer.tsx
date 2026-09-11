import { BrandLogo } from "./BrandLogo";
import { APP_URL, PRO_URL, SECTIONS } from "@/lib/links";
import { useScrollSplit } from "@/motion/useSplitText";

/* O rodapé.

   Duas responsabilidades, e a segunda é a que não pode faltar: a assinatura
   grande, que fecha a página como capa fecha uma publicação; e o aviso de
   limite, que é obrigação e não letra miúda.

   O aviso fica em corpo de leitura, não em 10px cinza no canto. Uma
   plataforma de saúde mental que esconde "não atendemos emergências" está
   escondendo a informação mais importante que tem a dar. */

const YEAR = new Date().getFullYear();

export function Footer() {
  const signature = useScrollSplit<HTMLDivElement>();

  return (
    <footer className="mt-16 border-t border-hairline bg-sunken/60">
      <div className="frame py-20 sm:py-24">
        {/* A assinatura em escala de capa. Todas as proporções internas da
            marca são medidas em `em`, então ampliar o tamanho preserva o ™,
            o espaço de `0.6em` e o símbolo de `1.4em` exatamente como
            aprovados. */}
        <div ref={signature} className="overflow-hidden">
          <BrandLogo className="text-[clamp(2rem,7.5vw,5.5rem)]" />
        </div>

        <div className="mt-16 grid gap-12 border-t border-hairline pt-10 md:grid-cols-12 md:gap-8">
          <nav aria-label="Acessar a plataforma" className="flex flex-col gap-4 md:col-span-4">
            <p className="type-eyebrow text-tertiary">Acessar</p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={APP_URL}
                  className="group/link flex items-baseline gap-3 text-body text-primary transition-colors duration-[--duration-fast] hover:text-accent-lavender"
                >
                  Entrar
                  <span className="type-meta text-tertiary">app.siouve.com</span>
                </a>
              </li>
              <li>
                <a
                  href={PRO_URL}
                  className="group/link flex items-baseline gap-3 text-body text-primary transition-colors duration-[--duration-fast] hover:text-accent-sage"
                >
                  Sou profissional
                  <span className="type-meta text-tertiary">pro.siouve.com</span>
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Seções desta página" className="flex flex-col gap-4 md:col-span-3">
            <p className="type-eyebrow text-tertiary">Nesta página</p>
            <ul className="flex flex-col gap-3">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="type-meta flex items-center gap-3 text-secondary transition-colors duration-[--duration-fast] hover:text-primary"
                  >
                    <span className="text-hairline-strong">{section.index}</span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* O aviso. Corpo de leitura, contraste de texto secundário — e
              não um rodapé cinza de 10px. */}
          <div className="flex flex-col gap-4 md:col-span-5">
            <p className="type-eyebrow text-tertiary">Antes de entrar</p>
            <p className="text-body text-secondary">
              A Siouve não é terapia e não substitui acompanhamento
              profissional. A Si organiza o que foi relatado e não realiza
              diagnóstico nem avaliação clínica.
            </p>
            <p className="text-body text-secondary">
              A plataforma <strong className="font-semibold text-primary">não atende emergências</strong>. Em
              situação de risco, procure atendimento imediato nos serviços de
              urgência da sua região.
            </p>
          </div>
        </div>

        <div className="type-meta mt-14 flex flex-col gap-3 border-t border-hairline pt-6 text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <span>© {YEAR} Siouve</span>
          <span className="text-hairline-strong">
            siouve.com · pt-BR · Editorial Clinical Modernism
          </span>
        </div>
      </div>
    </footer>
  );
}
