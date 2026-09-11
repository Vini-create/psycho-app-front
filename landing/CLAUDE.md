# Landing page da Siouve — contexto e limites

## Estado atual: implementação autorizada

A landing page da Siouve está em desenvolvimento. Preserve a direção visual,
os textos aprovados e as decisões técnicas existentes; implemente novas
alterações somente quando forem solicitadas.

## Permissão de escrita

Você só tem autorização para criar, editar, mover ou excluir arquivos dentro de `/home/vini/psycho-app-front/landing/`.

Todo o restante do projeto é somente leitura, a menos que eu autorize explicitamente uma alteração fora dessa pasta. Isso inclui os aplicativos existentes, pacotes compartilhados, documentação, arquivos de ambiente, configurações da raiz, workspace e lockfiles. Não contorne esse limite com scripts, links simbólicos, comandos de instalação ou ferramentas que alterem arquivos externos. Se uma tarefa precisar dessas alterações, explique a necessidade e aguarde minha autorização. Não faça commit, push ou deploy sem pedido explícito.

A pasta foi colocada fora de `apps/*` para não entrar automaticamente no workspace atual. A escolha da estrutura técnica e a configuração do deploy ficam para depois das referências e da autorização de implementação.

## Mudanças de identidade aprovadas em 11 de setembro de 2026

- O nome público da plataforma mudou de **Sinapsa** para **Siouve**.
- Em textos corridos, usar **Siouve**. A assinatura visual é **Siouve.**, com ponto final, um **™ pequeno sobrescrito após o ponto**, e o **símbolo à direita**. Não substituir ™ por ®.
- O símbolo foi vetorizado a partir da imagem aprovada pelo usuário. Preservar exatamente sua estrutura, orientação e proporções; não redesenhar nem substituir por uma estrela genérica.
- Os traços foram reforçados para aproximadamente o dobro da espessura visual original. A implementação usa preenchimento e contorno da mesma cor, `stroke-width="24"` e junções arredondadas no `viewBox="0 0 1254 1254"`.
- O ™ foi ampliado para `0.6em`. A palavra usa `font-editorial` (Newsreader), peso 400 e tracking `-0.04em`.
- O componente usa distância de `0.6em` entre palavra e símbolo, com símbolo de `1.4em × 1.4em`. O ™ tem posição absoluta `top: 0.15em` e `right: -0.95em`.
- Tamanhos atuais: `1.6rem` na navegação, `1.85rem` na autenticação e `1.75rem` como padrão do componente. A escala da landing pode ser pensada depois, mantendo as proporções aprovadas.
- Na interface, a marca acompanha o tema com `currentColor` e `text-primary`. O SVG independente usa `#FCF8ED` sobre fundo transparente.
- O favicon usa somente o símbolo espesso, com fundo transparente e cor adaptada ao tema do navegador. Não usar como favicon os ícones de instalação, que têm fundo `#141312`.
- Os pacotes internos ainda usam `@sinapsa/*`: isso é um identificador técnico, não a marca pública. Não renomear esses pacotes.

## Fontes de verdade para consultar, somente leitura

- `../packages/ui/src/components/BrandLogo.tsx`: composição atual e aprovada da marca.
- `../apps/patient/public/siouve-logo.svg`: símbolo vetorial atualizado.
- `../apps/patient/public/icons/siouve-favicon-v3.svg`: favicon transparente atualizado.
- `../packages/ui/src/styles/tokens.css` e `base.css`: cores, tipografia, escalas e estilos atuais.
- `../apps/patient/src/app/design-system/page.tsx`: demonstração do design system, incluindo a seção “Identidade Siouve”.
- `../SINAPSA_BRANDBOOK_DESIGN_SYSTEM_V2.md`: brandbook atualizado; o nome do arquivo é histórico.
- `../apps/patient/src/components/AuthCard.tsx`, `AppShell.tsx` e `../apps/patient/src/app/(app)/page.tsx`: linguagem visual e apresentação do produto.
- `../apps/professional/src/app/(app)/page.tsx` e `../README.md`: contexto do painel profissional e do produto.
- `../MOTION.md`: princípios de movimento.

Em divergências com documentos antigos, priorizar a identidade aprovada acima e os componentes/tokens atuais. Não ler nem reproduzir segredos de arquivos de ambiente. Quando a implementação for autorizada, qualquer cópia ou adaptação necessária deve ser criada apenas dentro de `landing/`.

## Direção da futura landing

A landing deve refletir o estilo interno real da Siouve e apresentar com clareza a ideia da plataforma, o que oferecemos e para quem. A linguagem atual é editorial: tipografia serifada, hierarquia de publicação, pastas e folhas, texturas discretas, microtipografia e painéis pastel sobre bases neutras, incluindo a experiência escura. Consultar o produto antes de propor uma direção; não criar uma identidade desconectada dele. As referências que ainda vou enviar devem orientar a composição final.

A Siouve oferece ao paciente um espaço para conversar com a Si, registrar acontecimentos e responder a check-ins. O compartilhamento de contexto com profissionais depende das permissões e ações previstas no produto. Para o profissional, organiza registros e contexto entre sessões. Confirmar capacidades no código e na documentação antes de transformá-las em promessas de marketing.

A Si é a companheira de IA da plataforma, não uma terapeuta. Não inventar eficácia clínica, certificações, números de usuários, depoimentos, preços ou funcionalidades. Não prometer que a plataforma substitui acompanhamento profissional ou atende emergências.

## Domínios e publicação futura

- Landing: `https://siouve.com`, planejada para um Worker próprio na Cloudflare.
- Aplicativo do paciente: `https://app.siouve.com`.
- Painel profissional: `https://pro.siouve.com`.
- Os futuros acessos “Entrar” e “Sou profissional” devem apontar aos aplicativos correspondentes.

Não usar os endereços antigos `workers.dev` nos links públicos. Configurações
de DNS e domínio continuam fora do escopo desta pasta.
