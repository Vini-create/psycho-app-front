import * as THREE from "three";

/* O campo que fica atrás de tudo.

   Referência 13 da pasta de referências — aqueles orbes de gradiente
   volumétrico — lida com o §04 do brandbook em vez de contra ele:

   - a base é `#141312`, o ambiente do dark. Os orbes nunca chegam perto de
     dominar: somados, ocupam a faixa de 10–20% reservada ao pastel;
   - são TRÊS famílias, não sete. Lavanda (reflexão, IA), fogblue (contexto
     neutro) e clay (acontecimento) — o teto do §04 é três por viewport;
   - o grão é o mesmo acabamento do `TextureLayer` do produto (§11):
     perceptível na composição, invisível na leitura.

   Tudo isto é um fragment shader num quad de tela cheia. Sem textura
   externa, sem requisição de rede, sem nada para falhar no carregamento. */

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    /* O quad ignora câmera e projeção de propósito: ele é o fundo, e fica
       fixo no plano distante em qualquer enquadramento. */
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uGrain;
  uniform vec3 uBase;
  uniform vec3 uOrbA;
  uniform vec3 uOrbB;
  uniform vec3 uOrbC;

  /* Ruído de valor. Barato e suficiente: ele só deforma o contorno dos
     orbes para que não leiam como três círculos perfeitos. */
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  /* Queda suave a partir do centro. O expoente alto é o que dá o miolo
     denso e a borda longa das referências — um smoothstep puro deixaria
     o orbe com cara de disco. */
  float orb(vec2 uv, vec2 center, float radius, float softness) {
    float d = length((uv - center) * vec2(uAspect, 1.0)) / radius;
    return pow(1.0 - clamp(d, 0.0, 1.0), softness);
  }

  void main() {
    vec2 uv = vUv;

    /* A deriva é lenta de propósito: um ciclo inteiro leva minutos. Nada
       nesta página deve pedir atenção enquanto alguém lê. */
    float t = uTime * 0.045;

    /* O ponteiro puxa o campo por uma fração do movimento. É profundidade,
       não perseguição do cursor. */
    vec2 pointer = uPointer * 0.035;

    /* A rolagem abre o campo para baixo, de modo que as seções seguintes
       recebem o gradiente já dissolvido em vez de um corte seco. */
    float scroll = uScroll * 0.22;

    vec2 aCenter = vec2(0.30 + sin(t * 0.9) * 0.07, 0.66 + cos(t * 0.7) * 0.05 - scroll);
    vec2 bCenter = vec2(0.74 + cos(t * 0.6) * 0.06, 0.38 + sin(t * 0.8) * 0.06 - scroll * 0.7);
    vec2 cCenter = vec2(0.52 + sin(t * 0.5 + 1.7) * 0.09, 0.88 + cos(t * 0.45) * 0.04 - scroll * 1.3);

    float warp = (noise(uv * 2.6 + t * 1.4) - 0.5) * 0.06;

    float a = orb(uv + pointer + warp, aCenter, 0.62, 2.4);
    float b = orb(uv + pointer * 0.6 - warp, bCenter, 0.50, 2.8);
    float c = orb(uv + pointer * 1.3, cCenter, 0.58, 3.2);

    vec3 color = uBase;
    color += uOrbA * a * 1.70;
    color += uOrbB * b * 1.35;
    color += uOrbC * c * 1.05;

    /* Vinheta. Fecha as bordas para que o texto sempre caia sobre o tom
       mais fechado do campo, e não sobre o miolo de um orbe. */
    vec2 v = (uv - 0.5) * vec2(uAspect, 1.0);
    color *= 1.0 - smoothstep(0.48, 1.18, length(v)) * 0.42;

    /* Grão animado — §11. A semente troca a cada quadro, senão o padrão
       fixo lê como sujeira na tela em vez de matéria do papel. */
    float grain = hash(uv * 900.0 + fract(uTime) * 100.0) - 0.5;
    color += grain * uGrain;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export interface Field {
  mesh: THREE.Mesh;
  update(time: number, scroll: number, pointer: THREE.Vector2): void;
  resize(aspect: number): void;
  dispose(): void;
}

/* Sem `convertSRGBToLinear` — e isto é a diferença entre ver os orbes e
   olhar para um retângulo preto.

   Um `ShaderMaterial` cru escreve direto no framebuffer: o Three só aplica
   conversão de espaço de cor e tone mapping a quem inclui os chunks
   correspondentes, e este shader não inclui nenhum. Converter para linear
   aqui levava `#4f455b` de 0,31 para 0,078 e o valor era gravado como se
   ainda fosse sRGB — os orbes existiam, mas a três vezes menos luz do que
   deveriam. Os hexadecimais entram como estão porque é assim que saem. */
const tone = (hex: string) => new THREE.Color(hex);

export function createField(): Field {
  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uAspect: { value: 1 },
    uGrain: { value: 0.055 },
    uBase: { value: tone("#141312") },
    uOrbA: { value: tone("#4f455b") },
    uOrbB: { value: tone("#3e4a53") },
    uOrbC: { value: tone("#5a443c") },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    depthTest: false,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;

  return {
    mesh,
    update(time, scroll, pointer) {
      uniforms.uTime.value = time;
      uniforms.uScroll.value = scroll;
      uniforms.uPointer.value.copy(pointer);
    },
    resize(aspect) {
      uniforms.uAspect.value = aspect;
    },
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
