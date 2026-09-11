import * as THREE from "three";

/* O estúdio onde a peça de cromo é fotografada.

   Cromo não tem cor própria: ele é inteiramente o que reflete. Um material
   metálico sem ambiente lê como plástico cinza — é por isso que este arquivo
   existe antes de qualquer material.

   O ambiente é pintado num canvas, em vez de carregado de um HDRI. Três
   motivos, nesta ordem: nenhuma requisição de rede a mais na primeira dobra;
   nenhum arquivo binário de MBs no bundle; e, o que mais importa, ele pode
   ser pintado com a paleta da marca. O reflexo que corre pela peça quando
   ela gira é lavanda e papel — os tons do §04 —, não o cinza-azulado de um
   estúdio genérico. */

const WIDTH = 1024;
const HEIGHT = 512;

/** Mancha de luz suave. É o que vira o brilho que atravessa o bevel. */
function light(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Faixa horizontal de luz — um softbox visto pelo reflexo. */
function band(
  ctx: CanvasRenderingContext2D,
  y: number,
  height: number,
  color: string,
  alpha: number,
  feather = 0.45,
) {
  const gradient = ctx.createLinearGradient(0, y, 0, y + height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(feather, color);
  gradient.addColorStop(1 - feather, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, WIDTH, height);
  ctx.globalAlpha = 1;
}

function paint(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponível para o mapa de ambiente.");

  /* O que faz cromo parecer cromo não é brilho: é CONTRASTE.

     A versão anterior era um degradê suave do escuro ao claro, e produzia
     cetim — um metal macio, sem evento. Metal polido é um espelho: ele não
     tem aparência própria, só devolve o estúdio. Se o estúdio é uma
     transição mole, o reflexo é uma transição mole.

     Então aqui o estúdio é construído como um estúdio de verdade: um fundo
     escuro, algumas faixas de luz bem definidas e um chão que devolve pouco.
     São as BORDAS entre essas faixas que viram as listras que correm pela
     peça quando ela gira — o efeito das referências de cromo líquido. */

  /* 1. Céu e chão. O alto é claro, o baixo fecha. */
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  /* O escuro do estúdio é MÉDIO, não preto.

     A primeira versão de alto contraste fechava em `#0a0908`, e o efeito
     colateral apareceu na viagem: havia poses em que a peça só encontrava
     essas zonas para refletir e voltava a ser uma silhueta — pelo motivo
     oposto ao de antes, mas com o mesmo resultado na tela. Com o piso em
     carvão médio o contraste das faixas continua cortando, e não existe mais
     orientação em que a peça fique sem nada para devolver. */
  sky.addColorStop(0.0, "#d2ccc1");
  sky.addColorStop(0.3, "#5d564c");
  sky.addColorStop(0.52, "#3a3630");
  sky.addColorStop(0.78, "#4a443c");
  sky.addColorStop(1.0, "#262320");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  /* 2. O horizonte: a faixa branca estreita e dura que vira o corte de luz
        mais nítido da peça. É a assinatura do metal polido. */
  band(ctx, HEIGHT * 0.44, HEIGHT * 0.1, "#ffffff", 1, 0.12);

  /* 3. Key alta e larga, em papel. Acende as faces viradas para cima. */
  band(ctx, HEIGHT * 0.06, HEIGHT * 0.2, "#fbf9f3", 0.92, 0.5);

  /* 4. Duas faixas estreitas fora de simetria. É a irregularidade delas que
        faz o reflexo parecer um lugar, e não um gradiente. */
  band(ctx, HEIGHT * 0.3, HEIGHT * 0.035, "#f1ede5", 0.85, 0.25);
  band(ctx, HEIGHT * 0.63, HEIGHT * 0.025, "#d8d2c6", 0.6, 0.3);
  band(ctx, HEIGHT * 0.72, HEIGHT * 0.05, "#efe9dd", 0.45, 0.4);

  /* 5. Rebote do chão, fraco: dá volume à parte de baixo sem competir com o
        horizonte. */
  band(ctx, HEIGHT * 0.86, HEIGHT * 0.09, "#8a8276", 0.5, 0.45);

  /* 6. Os dois acentos da marca. Sem eles a peça é prata de catálogo; com
        eles, a lavanda e o clay do §04 correm pelo metal quando ele gira, e
        o cromo passa a pertencer a esta identidade. */
  light(ctx, WIDTH * 0.2, HEIGHT * 0.38, HEIGHT * 0.42, "#c8b9d8", 0.5);
  light(ctx, WIDTH * 0.78, HEIGHT * 0.6, HEIGHT * 0.4, "#d49a82", 0.38);

  /* 7. Recortes escuros verticais. Um espelho sem nada escuro para refletir
        lê como plástico claro; são estas colunas que dão ao cromo os vazios
        profundos entre os brilhos. */
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#0d0c0b";
  ctx.fillRect(WIDTH * 0.37, 0, WIDTH * 0.05, HEIGHT);
  ctx.fillRect(WIDTH * 0.63, 0, WIDTH * 0.035, HEIGHT);
  ctx.globalAlpha = 1;

  return canvas;
}

/**
 * Gera o ambiente já pré-filtrado (PMREM).
 *
 * O PMREM é obrigatório e não é detalhe de performance: sem ele,
 * `roughness` não tem efeito nenhum sobre a reflexão, e a peça fica
 * espelhada como um cromo de para-choque em qualquer valor de rugosidade.
 */
export function createEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const source = new THREE.CanvasTexture(paint());
  source.mapping = THREE.EquirectangularReflectionMapping;
  source.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(source);

  source.dispose();
  pmrem.dispose();

  return target.texture;
}
