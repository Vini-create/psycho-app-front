import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { SYMBOL_PATH, SYMBOL_VIEWBOX } from "@/lib/symbol-path";

/* O símbolo da marca virando um objeto com espessura.

   A peça de cromo do topo da página não é uma estrela desenhada para a
   ocasião: é o `d` aprovado em `BrandLogo.tsx`, extrudado. Isso é deliberado
   e é a única forma de respeitar "preservar exatamente sua estrutura,
   orientação e proporções".

   UMA licença, e só uma, é tomada aqui — documentada porque mexe na marca:

   O contorno aprovado é um traçado de bitmap. Cada `L` anda um ou dois
   unidades, o que forma uma escadinha invisível em tela (são frações de
   pixel) mas destrutiva em 3D: o bevel transforma cada degrau numa faceta
   própria, e o cromo reflete isso como um chiado ao longo de toda a borda.

   A correção é um Douglas–Peucker de tolerância 2,5 num viewBox de 1254.
   Medido contra o contorno original, o desvio máximo do resultado é de 2,5
   unidades — 0,2% da largura. Ele apaga a
   escada e não move uma ponta sequer: as pontas do símbolo são vértices de
   curvatura máxima, e são exatamente os pontos que este algoritmo preserva
   por construção. Os pontos restantes descrevem curvatura real em vez de
   degraus do traçado.

   O logotipo em DOM continua usando o path original, sem simplificação
   alguma. A aproximação vive só na malha. */

const SIMPLIFY_TOLERANCE = 2.5;

/** Lê a polilinha fechada `M … L … Z` do símbolo. */
function readPoints(): THREE.Vector2[] {
  const numbers = SYMBOL_PATH.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 6) {
    throw new Error("O path do símbolo não pôde ser lido.");
  }

  const points: THREE.Vector2[] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    points.push(new THREE.Vector2(Number(numbers[i]), Number(numbers[i + 1])));
  }
  return points;
}

/** Distância perpendicular de `point` à reta `a`–`b`. */
function perpendicular(
  point: THREE.Vector2,
  a: THREE.Vector2,
  b: THREE.Vector2,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return point.distanceTo(a);

  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq;
  const clamped = Math.max(0, Math.min(1, t));
  return Math.hypot(point.x - (a.x + clamped * dx), point.y - (a.y + clamped * dy));
}

/**
 * Douglas–Peucker iterativo.
 *
 * Iterativo e não recursivo de propósito: são ~1560 pontos, e a versão
 * recursiva degenera para 1560 quadros de pilha numa polilinha quase
 * colinear como esta.
 */
function simplify(points: THREE.Vector2[], tolerance: number): THREE.Vector2[] {
  if (points.length < 3) return points;

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack: Array<[number, number]> = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    let maxDistance = 0;
    let index = -1;

    for (let i = first + 1; i < last; i += 1) {
      const distance = perpendicular(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i] === 1);
}

/**
 * A malha do símbolo, centrada na origem e normalizada para caber numa caixa
 * de 1 unidade — assim a cena trabalha em medidas próprias e trocar o path
 * não muda o enquadramento.
 */
export function createSymbolGeometry(): THREE.BufferGeometry {
  const raw = readPoints();
  const simplified = simplify(raw, SIMPLIFY_TOLERANCE);

  const half = SYMBOL_VIEWBOX / 2;
  const shape = new THREE.Shape();

  simplified.forEach((point, index) => {
    /* O eixo Y do SVG cresce para baixo e o do Three cresce para cima.
       Espelhar aqui é o que mantém a orientação aprovada do símbolo: sem
       isso a peça sai de cabeça para baixo. */
    const x = (point.x - half) / SYMBOL_VIEWBOX;
    const y = -(point.y - half) / SYMBOL_VIEWBOX;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();

  /* A espessura da peça é a largura de UMA ramificação do símbolo.

     Medido no próprio contorno, varrendo linhas horizontais longe do miolo:
     a mediana da largura de um braço é 32 unidades no viewBox de 1254, ou
     0,0255 normalizado. A versão anterior extrudava 0,1 — quatro vezes isso
     —, e o resultado era uma peça de acrílico, não a marca com corpo.

     A conta fecha somando o bevel, que também empurra em Z: 0,017 de corpo
     mais 0,004 de chanfro de cada lado dão os 0,025 da ramificação. */
  const BRANCH = 0.0255;

  /* O chanfro é estreito o bastante para não se cruzar nos braços finos.
     Ele suaviza a passagem da face para a lateral sem transformar cada ponta
     em um tubo ou criar faces sobrepostas. Seis segmentos são suficientes
     depois que os vértices coincidentes são soldados abaixo. */
  const bevelThickness = 0.006;
  const bevelSize = 0.0045;

  const extruded = new THREE.ExtrudeGeometry(shape, {
    depth: BRANCH - bevelThickness * 2,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelOffset: 0,
    bevelSegments: 6,
    curveSegments: 1,
  });

  /* O ExtrudeGeometry separa vértices por triângulo para preservar UVs.
     Em metal espelhado, essas emendas aparecem como pequenos retângulos nas
     laterais dos braços. A peça não usa textura, então removemos os UVs,
     soldamos os vértices coincidentes e recalculamos uma normal contínua. */
  extruded.deleteAttribute("normal");
  extruded.deleteAttribute("uv");
  const geometry = mergeVertices(extruded, 0.00005);
  extruded.dispose();

  geometry.center();
  geometry.computeVertexNormals();

  return geometry;
}
