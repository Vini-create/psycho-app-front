import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { prefersReducedMotion } from "@/motion/gsap";
import { createEnvironment } from "./environment";
import { createField } from "./field";
import { createSymbolGeometry } from "./symbolGeometry";

/* O palco: um canvas fixo que atravessa toda a página, com duas coisas dentro.

   1. O campo de orbes, que é o papel sobre o qual a landing é impressa.
   2. O símbolo da marca extrudado em cromo, que ATRAVESSA a página inteira.

   A primeira versão só existia na primeira dobra: girava um pouco e apagava
   ao rolar. Agora ela viaja — a rolagem é a trilha, e a peça muda de posição,
   escala, brilho e rotação ao longo dela, passando por onde a composição de
   cada seção deixa espaço.

   No desktop, o canvas continua atrás da composição. No telefone, a peça
   vira um objeto de primeiro plano: passa por cima do conteúdo, abaixo só
   da navegação, e continua sem capturar nenhum toque.

   MOTION.md §6 continua valendo: nada de conteúdo mora aqui. Sem WebGL, com
   o contexto perdido ou sob movimento reduzido, a página continua inteira. */

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ?? canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/* A trilha, em fração da rolagem do documento.

   `at` é onde o ponto acontece; `x`/`y` são unidades de cena; `scale` é o
   tamanho; `dim` é o quanto a peça se apaga (1 = cheia). Os valores vieram
   de olhar cada seção montada e perguntar onde sobra espaço:

   - 0.00  primeira dobra: coluna própria à direita da manchete. É objeto.
   - 0.16  o intervalo: a manchete toma a esquerda, a coluna de apoio o alto
           da direita e a régua de dias o rodapé. Sobra o vão da direita
           BAIXA, entre a coluna e a régua — e é ali que ela passa.
   - 0.38  quem somos: a coluna da direita ficou vazia para recebê-la; é
           ela que substitui a marca-d'água estática que existia ali.
   - 0.60  as pastas: a pilha ocupa a largura inteira. A peça sobe para o
           vão acima da cabeça de seção e encolhe, senão competiria com a
           folha aberta, que é o assunto da seção.
   - 0.80  as portas: dois painéis lado a lado, sem folga no miolo. Ela sai
           pela borda direita, quase toda cortada.
   - 1.00  o rodapé: a assinatura fecha a página embaixo à esquerda e o alto
           à direita fica livre. A peça volta a ser objeto para o fecho.

   Duas regras que saíram de erros, e que valem mais que os números:

   1. **Opacidade não é como se controla presença aqui.** Cromo sobre fundo
      escuro perde os brilhos junto com o alfa: a 0.7 a peça já não era mais
      metal, era um recorte cinza — e piorava quanto mais eu tentava
      escondê-la. No desktop o `dim` fica em 1 e quem regula a presença é a
      ESCALA, que encolhe a peça de 1.0 no hero para 0.42 sobre a pilha de
      pastas. Ela continua sendo metal o tempo todo; só ocupa menos.

      No telefone existe uma trilha própria: a peça alterna entre as bordas
      da viewport e passa na frente do conteúdo, com tamanho suficiente para
      continuar sendo um dos elementos centrais da experiência.

   2. O que importa não é onde os pontos ESTÃO, é por onde a peça PASSA.
      A primeira trilha tinha todos os pontos em espaço vazio e ainda assim
      atravessava a coluna de texto no meio do caminho entre dois deles,
      porque a interpolação não sabe o que é texto. Daí os `x` ficarem em
      1.05 ou mais em toda a faixa central: a peça só entra na largura da
      coluna na primeira dobra e no rodapé, os dois lugares onde a
      composição foi conferida e tem folga.

      O canvas é FIXO e o conteúdo rola por baixo dele, então não existe
      posição que fique livre o tempo todo — a única margem sempre vazia é a
      borda direita, e ela é estreita. É por isso que no trecho das pastas a
      peça encolhe para 0.32: pequena o bastante para caber nessa margem,
      em vez de tentar se esconder atrás do texto com opacidade, que já se
      provou o caminho errado. */
interface Waypoint {
  at: number;
  x: number;
  y: number;
  scale: number;
  dim: number;
}

const TRAIL: Waypoint[] = [
  { at: 0.0, x: 0.86, y: 0.1, scale: 1.0, dim: 1.0 },
  { at: 0.14, x: 1.18, y: -0.7, scale: 0.52, dim: 1.0 },
  { at: 0.3, x: 1.12, y: 0.3, scale: 0.64, dim: 1.0 },
  { at: 0.44, x: 1.05, y: -0.1, scale: 0.74, dim: 1.0 },
  /* Este ponto existe só para RECOLHER a peça antes da coluna de apoio da
     seção 03 entrar em cena. Sem ele, a interpolação de 0.44 para 0.58
     ainda a fazia atravessar esse texto na metade do caminho. */
  { at: 0.5, x: 1.48, y: 0.5, scale: 0.36, dim: 1.0 },
  { at: 0.58, x: 1.52, y: 0.45, scale: 0.32, dim: 1.0 },
  { at: 0.72, x: 1.46, y: 0.72, scale: 0.34, dim: 1.0 },
  { at: 0.86, x: 1.55, y: 0.15, scale: 0.66, dim: 0.95 },
  { at: 1.0, x: 0.78, y: 0.45, scale: 0.9, dim: 1.0 },
];

/* No telefone a peça percorre a viewport como primeiro plano. A escala base
   abaixo é multiplicada no desenho; os pontos controlam a respiração do
   percurso, sem deixá-la voltar ao tamanho de um ícone. */
const MOBILE_TRAIL: Waypoint[] = [
  { at: 0.0, x: 0.27, y: -0.18, scale: 0.5, dim: 1 },
  { at: 0.14, x: -0.27, y: 0.48, scale: 0.34, dim: 1 },
  { at: 0.3, x: 0.28, y: 0.32, scale: 0.3, dim: 1 },
  { at: 0.44, x: -0.28, y: -0.4, scale: 0.34, dim: 1 },
  { at: 0.58, x: 0.28, y: 0.46, scale: 0.3, dim: 1 },
  { at: 0.72, x: -0.27, y: 0.34, scale: 0.32, dim: 1 },
  { at: 0.86, x: 0.29, y: -0.36, scale: 0.36, dim: 1 },
  { at: 1.0, x: 0.25, y: 0.42, scale: 0.48, dim: 1 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Onde a peça está para uma dada fração de rolagem. */
function sample(progress: number, trail: readonly Waypoint[]): Waypoint {
  if (progress <= trail[0].at) return trail[0];
  if (progress >= trail[trail.length - 1].at) return trail[trail.length - 1];

  let i = 0;
  while (i < trail.length - 2 && progress > trail[i + 1].at) i += 1;

  const a = trail[i];
  const b = trail[i + 1];
  /* `smoothstep` e não linear: numa interpolação linear a peça muda de
     direção com um vinco visível em cada waypoint. */
  const t = smooth((progress - a.at) / (b.at - a.at));

  return {
    at: progress,
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    dim: a.dim + (b.dim - a.dim) * t,
  };
}

export function Stage({ onReady }: { onReady?: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !supportsWebGL()) {
      setFailed(true);
      readyRef.current?.();
      return;
    }

    const reduced = prefersReducedMotion();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setFailed(true);
      readyRef.current?.();
      return;
    }

    /* Limitamos o DPR a 1.4 no mobile e 1.75 no desktop. Renderizar um painel
       3x no telefone custa muito preenchimento para pouco ganho visual. */
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth >= 1024 ? 1.75 : 1.4),
    );
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.append(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      50,
    );
    camera.position.set(0, 0, 3.1);

    const environment = createEnvironment(renderer);
    scene.environment = environment;

    const field = createField();
    scene.add(field.mesh);

    const geometry = createSymbolGeometry();
    const material = new THREE.MeshPhysicalMaterial({
      /* Prata, não bege. O tom anterior puxava para o papel e tirava do
         metal a frieza que as referências têm. */
      color: new THREE.Color("#f6f4f0"),
      transparent: true,
      metalness: 1,
      /* Quase espelho. A rugosidade que havia antes (0.16) era o que
         transformava o reflexo em cetim: ela borra as bordas entre as
         faixas do estúdio, e são justamente essas bordas que o olho lê
         como cromo. Com 0.045 o estúdio chega inteiro à superfície.

         Não é zero porque um espelho perfeito some dentro do reflexo e o
         desenho do símbolo deixa de ser legível. */
      roughness: 0.045,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 2.6,
    });

    const symbol = new THREE.Mesh(geometry, material);
    scene.add(symbol);

    const key = new THREE.DirectionalLight("#fbf9f3", 2.4);
    key.position.set(-2.4, 2.6, 3.2);
    scene.add(key);

    /* Preenchimento vindo de trás da câmera.

       Sem ele a peça dependia inteiramente do mapa de ambiente para a face
       virada ao observador, e havia ângulos da viagem em que essa face não
       encontrava nada claro para refletir — o resultado era um recorte
       cinza no meio da página. Esta luz garante um piso de especular em
       qualquer pose, e é fraca o bastante para não achatar o contraste que
       o ambiente desenha. */
    const fill = new THREE.DirectionalLight("#e6ddcd", 0.9);
    fill.position.set(0.6, 0.2, 4);
    scene.add(fill);

    const pointer = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);

    /* Duas leituras diferentes da mesma rolagem:
       `progress` é a fração do documento (0 no topo, 1 no fim) e comanda a
       viagem da peça; `local` conta em alturas de tela e comanda a abertura
       do campo, que é um efeito de primeira dobra. */
    let progress = 0;
    let progressTarget = 0;
    let local = 0;
    let localTarget = 0;

    let wide = window.innerWidth >= 1024;
    let layoutWidth = 0;
    let layoutHeight = 0;

    const layout = (force = false) => {
      const { innerWidth: w, innerHeight: h } = window;

      /* A barra superior dos navegadores móveis abre e fecha durante a
         rolagem e emite `resize` mesmo sem a largura mudar. Redimensionar o
         framebuffer nesse instante interrompe o gesto e altera a câmera.
         Mantemos o primeiro tamanho estável e só recalculamos quando existe
         uma mudança real de largura, como rotação do aparelho. */
      const nextWide = w >= 1024;
      const widthChanged = Math.abs(w - layoutWidth) > 1;
      if (!force && !nextWide && !widthChanged) return;

      wide = nextWide;
      layoutWidth = w;
      layoutHeight = h;
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, wide ? 1.75 : 1.4),
      );
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      field.resize(w / h);

      /* No mobile o canvas fica na frente do conteúdo. O campo opaco segue
         no fallback CSS, atrás da página, e só a peça metálica ocupa esta
         camada superior. */
      field.mesh.visible = wide;
    };
    const onResize = () => layout();
    layout(true);

    const onPointer = (event: PointerEvent) => {
      target.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -((event.clientY / window.innerHeight) * 2 - 1),
      );
    };

    const onScroll = () => {
      const viewportHeight = wide ? window.innerHeight : layoutHeight;
      const max = Math.max(1, viewportHeight);
      localTarget = Math.min(window.scrollY / max, 2.2);

      const span = document.documentElement.scrollHeight - viewportHeight;
      progressTarget = span > 0 ? Math.min(Math.max(window.scrollY / span, 0), 1) : 0;
      resume();
    };

    let visible = !document.hidden;
    let frame = 0;
    let announced = false;
    const clock = new THREE.Clock();
    let previousElapsed = 0;

    const draw = () => {
      const elapsed = clock.getElapsedTime();
      const delta = Math.min(Math.max(elapsed - previousElapsed, 0), 0.05);
      previousElapsed = elapsed;

      pointer.lerp(target, 1 - Math.exp(-2.8 * delta));
      /* A interpolação é o que faz a viagem parecer fluida em vez de colada
         ao dedo: a peça persegue a posição da rolagem, sempre um pouco
         atrás. A constante considera o tempo real entre quadros; assim uma
         queda momentânea de FPS no celular não muda a velocidade aparente. */
      const progressFollow = 1 - Math.exp(-(wide ? 3.4 : 8.5) * delta);
      const localFollow = 1 - Math.exp(-5 * delta);
      progress += (progressTarget - progress) * progressFollow;
      local += (localTarget - local) * localFollow;

      field.update(elapsed, local, pointer);

      if (!reduced) {
        const at = sample(progress, wide ? TRAIL : MOBILE_TRAIL);

        symbol.position.x = at.x;
        symbol.position.y = at.y;
        symbol.scale.setScalar(at.scale * (wide ? 1.5 : 1.3));
        material.opacity = at.dim;
        symbol.visible = material.opacity > 0.015;

        /* A rotação é da ROLAGEM, com uma deriva lenta por cima para a peça
           nunca ficar totalmente parada quando o leitor para. Três voltas ao
           longo da página inteira: o suficiente para o giro ser percebido,
           longe o bastante de virar pião. */
        symbol.rotation.y = progress * Math.PI * 3 + elapsed * 0.05 + pointer.x * 0.4;
        symbol.rotation.x = Math.sin(progress * Math.PI * 2) * 0.45 - pointer.y * 0.28;
        symbol.rotation.z = progress * 0.9;
      }

      renderer.render(scene, camera);

      /* O primeiro quadro desenhado é o sinal para a tela de carregamento
         sair: daí em diante existe imagem no canvas, e não um buraco. */
      if (!announced) {
        announced = true;
        readyRef.current?.();
      }

      frame = requestAnimationFrame(draw);
    };

    function resume() {
      if (frame === 0 && visible && !reduced) frame = requestAnimationFrame(draw);
    }

    function pause() {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    if (reduced) {
      /* Um quadro só, e sem a peça.

         Deixá-la no quadro estático era um bug de acessibilidade: o canvas é
         `fixed`, então o único quadro desenhado fica parado sobre a página
         inteira, e quem pede movimento reduzido nunca dispara a viagem que o
         tiraria da frente do texto. A peça é o acabamento que depende de
         movimento para existir; sem ele, é só um obstáculo. O campo fica,
         porque campo parado continua sendo fundo. */
      symbol.visible = false;
      field.update(0, 0, pointer);
      renderer.render(scene, camera);
      readyRef.current?.();
    } else {
      onScroll();
      resume();
    }

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) resume();
      else pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onLost = (event: Event) => {
      event.preventDefault();
      pause();
      setFailed(true);
      readyRef.current?.();
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    return () => {
      pause();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);

      field.dispose();
      geometry.dispose();
      material.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <>
      {/* O fallback fica sempre montado, atrás do canvas: é o que se vê no
          primeiro quadro e é o que sobra se o WebGL não subir nunca. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ambient"
        style={{
          backgroundImage:
            "radial-gradient(60% 55% at 28% 62%, #4f455b 0%, transparent 68%), radial-gradient(52% 48% at 76% 34%, #3e4a53 0%, transparent 66%), radial-gradient(58% 44% at 52% 96%, #5a443c 0%, transparent 70%)",
          opacity: 0.5,
        }}
      />
      {!failed && (
        <div
          ref={hostRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-30 overflow-hidden lg:-z-10"
        />
      )}
    </>
  );
}
