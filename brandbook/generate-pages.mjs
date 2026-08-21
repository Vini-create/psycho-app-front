import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'pages');
fs.mkdirSync(out, { recursive: true });

const C = {
  paper: '#F1E5CD', ivory: '#E7D7B8', white: '#FAF4E8', line: '#DCC9A7',
  ink: '#1D191E', muted: '#6B626D', purple: '#604174', deep: '#35223F',
  plum: '#4B315C', mid: '#765292', soft: '#BFA6D2', pale: '#EDE5F3',
  green: '#2F6B58', greenBg: '#EFF7F2', red: '#9B3D47', redBg: '#FCF0F1',
  blue: '#365F7A', blueBg: '#F0F6FA', amber: '#7A5815', amberBg: '#FCF6E8',
  darkCanvas: '#181519', darkSubtle: '#201C22', darkSurface: '#28222B', darkElevated: '#302833',
  darkText: '#F1E5CD', darkTextSecondary: '#CFC1AA', darkBorder: '#55485B', darkControl: '#7C697F',
  darkPrimary: '#655A7C', darkPrimaryHover: '#765292', darkPrimaryPressed: '#4B315C',
};

const font = `font-family="Nimbus Sans Narrow, Arial Narrow, Noto Sans, sans-serif"`;
const serif = `font-family="STIX Two Text, Noto Serif, serif"`;
const mono = `font-family="Source Code Pro, Noto Sans Mono, monospace"`;

const base = (n, kicker, title, body, options = {}) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="${options.bg || C.paper}"/>
  ${options.top || ''}
  <text x="80" y="74" ${font} font-size="18" font-weight="600" letter-spacing="3" fill="${options.light ? C.pale : C.mid}">${kicker.toUpperCase()}</text>
  ${title ? `<text x="80" y="154" ${serif} font-size="64" font-weight="400" fill="${options.light ? C.white : C.ink}">${title}</text>` : ''}
  ${body}
  <line x1="80" y1="944" x2="1520" y2="944" stroke="${options.light ? '#594665' : C.line}" stroke-width="1"/>
  <text x="80" y="974" ${mono} font-size="13" fill="${options.light ? C.soft : C.muted}">SINAPSA. · DESIGN DIRECTION 0.8</text>
  <text x="1520" y="974" text-anchor="end" ${mono} font-size="13" fill="${options.light ? C.soft : C.muted}">${String(n).padStart(2, '0')}</text>
</svg>`;

const pages = [];

pages.push(`
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="${C.ivory}"/>
  <path d="M880,-80 C1150,40 1120,235 1350,250 C1520,260 1620,180 1670,100 L1670,-80Z" fill="${C.soft}" opacity=".72"/>
  <path d="M1040,1000 C950,850 1045,690 1210,640 C1380,588 1530,680 1660,590 L1660,1020Z" fill="${C.purple}"/>
  <path d="M-80,760 C180,610 310,770 500,650 C655,552 690,358 606,212 C540,98 342,72 154,134 C45,170 -30,210 -80,250Z" fill="${C.pale}"/>
  <circle cx="185" cy="195" r="62" fill="${C.mid}"/>
  <text x="80" y="78" ${font} font-size="18" font-weight="600" letter-spacing="4" fill="${C.mid}">DESIGN DIRECTION · 0.8</text>
  <text x="80" y="492" ${serif} font-size="164" letter-spacing="-7" fill="${C.ink}">Sinapsa.</text>
  <text x="590" y="416" ${font} font-size="18" font-weight="600" fill="${C.purple}">™</text>
  <line x1="88" y1="532" x2="608" y2="532" stroke="${C.purple}" stroke-width="8" stroke-linecap="round"/>
  <text x="86" y="600" ${font} font-size="27" font-weight="500" fill="${C.muted}">editorial · humana · serena</text>
  <text x="86" y="820" ${font} font-size="18" letter-spacing="2" fill="${C.ink}">SISTEMA VISUAL PROVISÓRIO</text>
  <text x="86" y="854" ${font} font-size="16" fill="${C.muted}">Paleta · tipografia · hierarquia · cards · composição · temas</text>
  <text x="1516" y="942" text-anchor="end" ${mono} font-size="14" fill="${C.ivory}">AGOSTO 2026 · 01</text>
</svg>`);

pages.push(base(2, '01 · DNA visual', 'Leveza com estrutura.', `
  <text x="82" y="206" ${font} font-size="21" fill="${C.muted}">A expressão é editorial. A interação continua simples, direta e legível.</text>
  <g transform="translate(80 275)">
    <rect width="450" height="370" rx="28" fill="${C.pale}"/>
    <text x="34" y="66" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.purple}">01</text>
    <text x="34" y="142" ${serif} font-size="58" fill="${C.ink}">Editorial</text>
    <path d="M35 188 C140 125 230 246 414 164" fill="none" stroke="${C.mid}" stroke-width="7" stroke-linecap="round"/>
    <text x="34" y="290" ${font} font-size="18" fill="${C.ink}">Serifas expressivas</text>
    <text x="34" y="326" ${font} font-size="18" fill="${C.ink}">Escala e espaço negativo</text>
  </g>
  <g transform="translate(575 275)">
    <rect width="450" height="370" rx="28" fill="${C.ink}"/>
    <text x="34" y="66" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.soft}">02</text>
    <text x="34" y="142" ${serif} font-size="58" fill="${C.ivory}">Humana</text>
    <circle cx="365" cy="105" r="48" fill="${C.purple}"/>
    <circle cx="325" cy="158" r="48" fill="${C.soft}" opacity=".88"/>
    <text x="34" y="290" ${font} font-size="18" fill="${C.ivory}">Calor sem infantilização</text>
    <text x="34" y="326" ${font} font-size="18" fill="${C.ivory}">Presença sem personificação</text>
  </g>
  <g transform="translate(1070 275)">
    <rect width="450" height="370" rx="28" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <text x="34" y="66" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.purple}">03</text>
    <text x="34" y="142" ${serif} font-size="58" fill="${C.ink}">Serena</text>
    <path d="M32 194 Q170 126 245 198 T420 184" fill="none" stroke="${C.soft}" stroke-width="22" stroke-linecap="round"/>
    <text x="34" y="290" ${font} font-size="18" fill="${C.ink}">Tons suaves, contraste real</text>
    <text x="34" y="326" ${font} font-size="18" fill="${C.ink}">Movimento contínuo e curto</text>
  </g>
  <g transform="translate(80 700)">
    <text x="0" y="42" ${serif} font-size="72" fill="${C.purple}">70</text>
    <text x="105" y="40" ${font} font-size="17" font-weight="600" fill="${C.ink}">NEUTROS CLAROS</text>
    <text x="535" y="42" ${serif} font-size="72" fill="${C.ink}">20</text>
    <text x="640" y="40" ${font} font-size="17" font-weight="600" fill="${C.ink}">ESTRUTURA</text>
    <text x="1040" y="42" ${serif} font-size="72" fill="${C.mid}">10</text>
    <text x="1145" y="40" ${font} font-size="17" font-weight="600" fill="${C.ink}">COR E PRESENÇA</text>
  </g>`));

pages.push(base(3, '02 · Paleta', 'Marfim, tinta e lavanda.', `
  <text x="82" y="206" ${font} font-size="21" fill="${C.muted}">Canvas newsprint #F1E5CD. O roxo orienta. O off-black sustenta.</text>
  <g transform="translate(80 275)">
    <rect width="330" height="260" rx="24" fill="${C.white}" stroke="${C.line}"/>
    <text x="24" y="205" ${serif} font-size="34" fill="${C.ink}">Surface</text><text x="24" y="235" ${font} font-size="15" fill="${C.muted}">#FAF4E8</text>
    <rect x="350" width="330" height="260" rx="24" fill="${C.ivory}"/>
    <text x="374" y="205" ${serif} font-size="34" fill="${C.ink}">Aged paper</text><text x="374" y="235" ${font} font-size="15" fill="${C.ink}">#E7D7B8</text>
    <rect x="700" width="330" height="260" rx="24" fill="${C.soft}"/>
    <text x="724" y="205" ${serif} font-size="34" fill="${C.deep}">Lavender</text><text x="724" y="235" ${font} font-size="15" fill="${C.deep}">#BFA6D2</text>
    <rect x="1050" width="330" height="260" rx="24" fill="${C.purple}"/>
    <text x="1074" y="205" ${serif} font-size="34" fill="${C.ivory}">Synapse</text><text x="1074" y="235" ${font} font-size="15" fill="${C.pale}">#604174</text>
  </g>
  <g transform="translate(80 560)">
    <rect width="1440" height="232" rx="24" fill="${C.ink}"/>
    <text x="34" y="60" ${serif} font-size="42" fill="${C.ivory}">Obsidian</text>
    <text x="34" y="94" ${font} font-size="15" fill="${C.soft}">#1D191E · texto principal e superfícies escuras</text>
    <g transform="translate(520 30)">
      <rect width="130" height="108" rx="16" fill="#FAF7FC"/><rect x="145" width="130" height="108" rx="16" fill="#EDE5F3"/>
      <rect x="290" width="130" height="108" rx="16" fill="#DCCDE8"/><rect x="435" width="130" height="108" rx="16" fill="#9E7BBA"/>
      <rect x="580" width="130" height="108" rx="16" fill="#765292"/><rect x="725" width="130" height="108" rx="16" fill="#35223F"/>
      <text x="0" y="143" ${mono} font-size="11" fill="${C.pale}">050 · FAF7FC</text><text x="145" y="143" ${mono} font-size="11" fill="${C.pale}">100 · EDE5F3</text>
      <text x="290" y="143" ${mono} font-size="11" fill="${C.pale}">200 · DCCDE8</text><text x="435" y="143" ${mono} font-size="11" fill="${C.pale}">400 · 9E7BBA</text>
      <text x="580" y="143" ${mono} font-size="11" fill="${C.pale}">500 · 765292</text><text x="725" y="143" ${mono} font-size="11" fill="${C.pale}">800 · 35223F</text>
    </g>
  </g>
  <text x="80" y="838" ${font} font-size="16" font-weight="700" fill="${C.purple}">REGRA</text>
  <text x="165" y="838" ${serif} font-size="18" fill="${C.ink}">Lavandas claras são superfície e decoração — nunca texto sobre fundo claro.</text>`));

pages.push(base(4, '03 · Cor em uso', 'Suave não é apagado.', `
  <g transform="translate(80 235)">
    <rect width="690" height="276" rx="26" fill="${C.white}" stroke="${C.line}"/>
    <text x="34" y="50" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.green}">COMBINAÇÕES APROVADAS</text>
    <rect x="34" y="84" width="292" height="74" rx="14" fill="${C.purple}"/><text x="180" y="132" text-anchor="middle" ${font} font-size="19" font-weight="700" fill="${C.white}">Ação principal · 7.65:1</text>
    <rect x="350" y="84" width="292" height="74" rx="14" fill="${C.pale}"/><text x="496" y="132" text-anchor="middle" ${font} font-size="19" font-weight="700" fill="${C.ink}">Destaque · 14.13:1</text>
    <text x="34" y="216" ${font} font-size="18" fill="${C.ink}">Texto principal sobre paper</text>
    <text x="642" y="216" text-anchor="end" ${font} font-size="18" font-weight="700" fill="${C.green}">13.91:1</text>
    <line x1="34" y1="238" x2="642" y2="238" stroke="${C.line}"/>
  </g>
  <g transform="translate(830 235)">
    <rect width="690" height="276" rx="26" fill="${C.redBg}" stroke="#F1D8DC"/>
    <text x="34" y="50" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.red}">NÃO USAR</text>
    <rect x="34" y="84" width="292" height="74" rx="14" fill="${C.pale}"/><text x="180" y="132" text-anchor="middle" ${font} font-size="19" fill="${C.soft}">Texto lavanda claro</text>
    <rect x="350" y="84" width="292" height="74" rx="14" fill="${C.soft}"/><text x="496" y="132" text-anchor="middle" ${font} font-size="19" fill="#EDE5F3">Baixo contraste</text>
    <text x="34" y="216" ${font} font-size="18" fill="${C.red}">Pastel não substitui contraste.</text>
    <text x="642" y="216" text-anchor="end" ${font} font-size="18" font-weight="700" fill="${C.red}">REPROVADO</text>
    <line x1="34" y1="238" x2="642" y2="238" stroke="#F1D8DC"/>
  </g>
  <g transform="translate(80 555)">
    <text x="0" y="32" ${font} font-size="15" font-weight="700" letter-spacing="2" fill="${C.muted}">CORES SEMÂNTICAS</text>
    <g transform="translate(0 70)"><rect width="330" height="122" rx="20" fill="${C.greenBg}"/><circle cx="35" cy="34" r="10" fill="${C.green}"/><text x="58" y="42" ${font} font-size="19" font-weight="700" fill="${C.green}">Sucesso</text><text x="26" y="88" ${font} font-size="15" fill="${C.ink}">#2F6B58 · confirmação</text></g>
    <g transform="translate(370 70)"><rect width="330" height="122" rx="20" fill="${C.amberBg}"/><circle cx="35" cy="34" r="10" fill="${C.amber}"/><text x="58" y="42" ${font} font-size="19" font-weight="700" fill="${C.amber}">Atenção</text><text x="26" y="88" ${font} font-size="15" fill="${C.ink}">#7A5815 · cautela</text></g>
    <g transform="translate(740 70)"><rect width="330" height="122" rx="20" fill="${C.redBg}"/><circle cx="35" cy="34" r="10" fill="${C.red}"/><text x="58" y="42" ${font} font-size="19" font-weight="700" fill="${C.red}">Erro</text><text x="26" y="88" ${font} font-size="15" fill="${C.ink}">#9B3D47 · falha</text></g>
    <g transform="translate(1110 70)"><rect width="330" height="122" rx="20" fill="${C.blueBg}"/><circle cx="35" cy="34" r="10" fill="${C.blue}"/><text x="58" y="42" ${font} font-size="19" font-weight="700" fill="${C.blue}">Informação</text><text x="26" y="88" ${font} font-size="15" fill="${C.ink}">#365F7A · contexto</text></g>
  </g>
  <text x="80" y="855" ${font} font-size="16" fill="${C.muted}">Cor + rótulo + forma. Estado nunca depende apenas da cor.</text>`));

pages.push(base(5, '04 · Texturas', 'Granulação como matéria.', `
  <defs>
    <linearGradient id="chromaticBase" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#DCCDE8"/><stop offset="0.34" stop-color="#8C78D8"/>
      <stop offset="0.64" stop-color="#3B387D"/><stop offset="1" stop-color="#1D191E"/>
    </linearGradient>
    <radialGradient id="lavenderGlow" cx="0.18" cy="0.16" r="0.72">
      <stop offset="0" stop-color="#E7CFE9" stop-opacity="0.96"/><stop offset="0.58" stop-color="#8B7BE0" stop-opacity="0.38"/><stop offset="1" stop-color="#1D191E" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="inkBloom" cx="0.78" cy="0.22" r="0.62">
      <stop offset="0" stop-color="#15131A"/><stop offset="0.56" stop-color="#2D2845" stop-opacity="0.74"/><stop offset="1" stop-color="#655A7C" stop-opacity="0"/>
    </radialGradient>
    <filter id="grainChromatic" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" seed="27" result="noise"/>
      <feColorMatrix in="noise" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 .44 0" result="grain"/>
      <feBlend in="SourceGraphic" in2="grain" mode="soft-light"/>
    </filter>
    <filter id="grainPaper" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="11" result="noise"/>
      <feColorMatrix in="noise" values=".7 0 0 0 .2  0 .6 0 0 .16  0 0 .45 0 .1  0 0 0 .16 0" result="grain"/>
      <feBlend in="SourceGraphic" in2="grain" mode="multiply"/>
    </filter>
    <filter id="grainDark" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="4" seed="43" result="noise"/>
      <feColorMatrix in="noise" values=".6 0 0 0 .1  0 .45 0 0 .08  0 0 .8 0 .16  0 0 0 .30 0" result="grain"/>
      <feBlend in="SourceGraphic" in2="grain" mode="screen"/>
    </filter>
  </defs>
  <text x="80" y="205" ${serif} font-size="20" fill="${C.muted}">Textura física, transições amplas e ruído visível — sem comprometer a leitura.</text>
  <g transform="translate(80 245)">
    <rect width="900" height="470" rx="28" fill="url(#chromaticBase)"/>
    <rect width="900" height="470" rx="28" fill="url(#lavenderGlow)"/>
    <rect width="900" height="470" rx="28" fill="url(#inkBloom)" filter="url(#grainChromatic)"/>
    <text x="34" y="54" ${font} font-size="15" font-weight="700" letter-spacing="3" fill="#F4E8F7">TEXTURE-CHROMATIC</text>
    <text x="34" y="390" ${serif} font-size="48" font-style="italic" fill="#F4E8F7">Granulado cromático.</text>
    <text x="34" y="430" ${mono} font-size="12" fill="#E6D8F0">purple · lavender · ink / 12–22%</text>
  </g>
  <g transform="translate(1020 245)">
    <rect width="500" height="218" rx="24" fill="${C.paper}" filter="url(#grainPaper)"/>
    <text x="28" y="48" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.purple}">TEXTURE-PAPER</text>
    <text x="28" y="122" ${serif} font-size="34" fill="${C.ink}">Papel antigo</text>
    <text x="28" y="164" ${mono} font-size="12" fill="${C.muted}">multiply · 1.5–4%</text>
    <text x="28" y="190" ${mono} font-size="11" fill="${C.muted}">canvas / institucional</text>
  </g>
  <g transform="translate(1020 497)">
    <rect width="500" height="218" rx="24" fill="${C.darkCanvas}" filter="url(#grainDark)"/>
    <text x="28" y="48" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.soft}">TEXTURE-OBSIDIAN</text>
    <text x="28" y="122" ${serif} font-size="34" fill="${C.darkText}">Grão noturno</text>
    <text x="28" y="164" ${mono} font-size="12" fill="${C.darkTextSecondary}">soft-light · 6–12%</text>
    <text x="28" y="190" ${mono} font-size="11" fill="${C.darkTextSecondary}">dark editorial / uso restrito</text>
  </g>
  <g transform="translate(80 785)">
    <text ${font} font-size="15" font-weight="700" letter-spacing="2" fill="${C.purple}">USAR</text><text x="66" ${serif} font-size="18" fill="${C.ink}">hero · capa · manifesto · faixa editorial</text>
    <text x="690" ${font} font-size="15" font-weight="700" letter-spacing="2" fill="${C.red}">EVITAR</text><text x="766" ${serif} font-size="18" fill="${C.ink}">formulário · tabela · modal · texto longo</text>
  </g>
  <text x="80" y="852" ${mono} font-size="12" fill="${C.muted}">fractalNoise 0.65–0.95 · 3–4 octaves · asset original ou geração procedural</text>`));

pages.push(base(6, '05 · Tipografia', 'Três vozes, um só ritmo.', `
  <g transform="translate(80 225)">
    <rect width="650" height="580" rx="28" fill="${C.ink}"/>
    <text x="38" y="54" ${font} font-size="16" font-weight="700" letter-spacing="3" fill="${C.soft}">EDITORIAL · STIX TWO TEXT</text>
    <text x="38" y="158" ${serif} font-size="94" letter-spacing="-4" fill="${C.ivory}">Sinapsa.</text>
    <text x="38" y="260" ${serif} font-size="64" font-style="italic" fill="${C.soft}">Leveza que</text>
    <text x="38" y="328" ${serif} font-size="64" font-style="italic" fill="${C.soft}">acompanha.</text>
    <line x1="38" y1="376" x2="612" y2="376" stroke="#554A58"/>
    <text x="38" y="424" ${serif} font-size="22" fill="${C.ivory}">Títulos, leitura longa e cards editoriais.</text>
    <text x="38" y="470" ${mono} font-size="13" fill="#BFB5C1">400 / -0.03em / 0.96–1.55</text>
    <text x="38" y="522" ${serif} font-size="17" fill="#D5CAD6">Aa Bb Cc Dd Ee Ff Gg · 0123456789</text>
  </g>
  <g transform="translate(770 225)">
    <rect width="750" height="280" rx="28" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <text x="34" y="52" ${font} font-size="16" font-weight="700" letter-spacing="3" fill="${C.mid}">UTILITÁRIA · NIMBUS SANS NARROW</text>
    <text x="34" y="124" ${font} font-size="46" font-weight="700" fill="${C.ink}">CLARO, DIRETO, CONDENSADO.</text>
    <text x="34" y="170" ${font} font-size="28" fill="${C.ink}">Navegação · controles · filtros · status</text>
    <text x="34" y="222" ${font} font-size="18" letter-spacing="2" fill="${C.muted}">ABCDEFGHIJKLMNOPQRSTUVWXYZ · 0123456789</text>
  </g>
  <g transform="translate(770 530)">
    <rect width="750" height="275" rx="28" fill="${C.pale}"/>
    <text x="34" y="52" ${font} font-size="16" font-weight="700" letter-spacing="3" fill="${C.purple}">METADADOS · SOURCE CODE PRO</text>
    <text x="34" y="118" ${mono} font-size="27" font-weight="600" fill="${C.deep}">12 AGO 2026 · 09:42 · #604174</text>
    <text x="34" y="168" ${mono} font-size="18" fill="${C.deep}">space-6: 24px  /  radius-card: 16px</text>
    <line x1="34" y1="200" x2="716" y2="200" stroke="${C.soft}"/>
    <text x="34" y="238" ${mono} font-size="14" fill="${C.purple}">tokens · datas · medidas · proveniência</text>
  </g>
  <text x="80" y="865" ${font} font-size="17" font-weight="700" fill="${C.purple}">REGRA</text>
  <text x="158" y="865" ${serif} font-size="18" fill="${C.ink}">Serif conduz a leitura; sans condensada organiza a função; mono registra precisão.</text>`));

pages.push(base(7, '06 · Fontes', 'Pesos, estilos e combinações.', `
  <g transform="translate(80 220)">
    <rect width="860" height="585" rx="28" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <text x="32" y="48" ${font} font-size="15" font-weight="700" letter-spacing="3" fill="${C.mid}">STIX TWO TEXT · ESPÉCIME EDITORIAL</text>
    <text x="32" y="112" ${serif} font-size="42" font-weight="400" fill="${C.ink}">Regular 400 · A conversa continua.</text>
    <line x1="32" y1="138" x2="828" y2="138" stroke="${C.line}"/>
    <text x="32" y="198" ${serif} font-size="42" font-weight="500" fill="${C.ink}">Medium 500 · Mais contexto.</text>
    <line x1="32" y1="224" x2="828" y2="224" stroke="${C.line}"/>
    <text x="32" y="284" ${serif} font-size="42" font-weight="600" fill="${C.ink}">Semibold 600 · Título de card.</text>
    <line x1="32" y1="310" x2="828" y2="310" stroke="${C.line}"/>
    <text x="32" y="370" ${serif} font-size="42" font-style="italic" fill="${C.purple}">Italic 400 · Uma pausa na leitura.</text>
    <line x1="32" y1="396" x2="828" y2="396" stroke="${C.line}"/>
    <text x="32" y="452" ${serif} font-size="26" fill="${C.ink}">Aa Bb Cc Çç Dd Ee Ff Gg Hh Ii Jj</text>
    <text x="32" y="492" ${serif} font-size="26" fill="${C.ink}">Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu</text>
    <text x="32" y="532" ${serif} font-size="26" fill="${C.ink}">Vv Ww Xx Yy Zz · 0123456789</text>
  </g>
  <g transform="translate(980 220)">
    <rect width="540" height="270" rx="24" fill="${C.ink}"/>
    <text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.soft}">NIMBUS SANS NARROW</text>
    <text x="28" y="105" ${font} font-size="38" font-weight="400" fill="${C.ivory}">REGULAR 400</text>
    <text x="28" y="158" ${font} font-size="42" font-weight="700" fill="${C.ivory}">BOLD 700</text>
    <text x="28" y="214" ${font} font-size="21" letter-spacing="2" fill="${C.soft}">AÇÃO · STATUS · FILTRO</text>
  </g>
  <g transform="translate(980 515)">
    <rect width="540" height="290" rx="24" fill="${C.pale}"/>
    <text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.purple}">SOURCE CODE PRO</text>
    <text x="28" y="100" ${mono} font-size="18" font-weight="400" fill="${C.deep}">Regular 400 · 21 AGO</text>
    <text x="28" y="145" ${mono} font-size="18" font-weight="500" fill="${C.deep}">Medium 500 · 09:42</text>
    <text x="28" y="190" ${mono} font-size="18" font-weight="600" fill="${C.deep}">Semibold 600 · 24px</text>
    <line x1="28" y1="220" x2="512" y2="220" stroke="${C.soft}"/>
    <text x="28" y="258" ${mono} font-size="13" fill="${C.purple}">#604174 / R16 / GAP-24</text>
  </g>
  <text x="80" y="865" ${font} font-size="17" fill="${C.muted}">Acentos, números, itálicos e pesos precisam ser testados antes de qualquer troca.</text>`));

pages.push(base(8, '07 · Uso tipográfico', 'Qual fonte entra em cada lugar.', `
  <text x="80" y="205" ${serif} font-size="20" fill="${C.muted}">Uma família conduz a leitura, outra organiza a função e a terceira registra precisão.</text>
  <g transform="translate(80 245)">
    <rect width="450" height="590" rx="26" fill="${C.ink}"/>
    <text x="30" y="48" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.soft}">LEITURA E EXPRESSÃO</text>
    <text x="30" y="116" ${serif} font-size="43" fill="${C.ivory}">STIX Two Text</text>
    <line x1="30" y1="145" x2="420" y2="145" stroke="#554A58"/>
    <text x="30" y="190" ${font} font-size="14" font-weight="700" fill="${C.soft}">USAR EM</text>
    <text x="30" y="232" ${serif} font-size="21" fill="${C.ivory}">Marca e hero</text>
    <text x="30" y="270" ${serif} font-size="21" fill="${C.ivory}">Títulos de página e cards</text>
    <text x="30" y="308" ${serif} font-size="21" fill="${C.ivory}">Corpo, conversa e leitura</text>
    <text x="30" y="346" ${serif} font-size="21" font-style="italic" fill="${C.soft}">Citações e destaques</text>
    <line x1="30" y1="390" x2="420" y2="390" stroke="#554A58"/>
    <text x="30" y="430" ${font} font-size="14" font-weight="700" fill="#D999A2">NÃO USAR EM</text>
    <text x="30" y="468" ${mono} font-size="13" fill="#D5CAD6">botão · label · filtro</text>
    <text x="30" y="498" ${mono} font-size="13" fill="#D5CAD6">navegação · status</text>
    <text x="30" y="552" ${mono} font-size="12" fill="${C.soft}">400–600 / 17–72px</text>
  </g>
  <g transform="translate(575 245)">
    <rect width="450" height="590" rx="26" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <text x="30" y="48" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.mid}">FUNÇÃO E ORIENTAÇÃO</text>
    <text x="30" y="116" ${font} font-size="40" font-weight="700" fill="${C.ink}">NIMBUS SANS</text>
    <text x="30" y="152" ${font} font-size="40" font-weight="700" fill="${C.ink}">NARROW</text>
    <line x1="30" y1="178" x2="420" y2="178" stroke="${C.line}"/>
    <text x="30" y="220" ${font} font-size="14" font-weight="700" fill="${C.mid}">USAR EM</text>
    <text x="30" y="260" ${font} font-size="23" font-weight="700" fill="${C.ink}">OVERLINE E SEÇÃO</text>
    <text x="30" y="300" ${font} font-size="23" font-weight="700" fill="${C.ink}">NAVEGAÇÃO E ABAS</text>
    <text x="30" y="340" ${font} font-size="23" font-weight="700" fill="${C.ink}">BOTÕES E LABELS</text>
    <text x="30" y="380" ${font} font-size="23" font-weight="700" fill="${C.ink}">TAGS E STATUS</text>
    <line x1="30" y1="420" x2="420" y2="420" stroke="${C.line}"/>
    <text x="30" y="460" ${font} font-size="14" font-weight="700" fill="${C.red}">NÃO USAR EM</text>
    <text x="30" y="498" ${mono} font-size="13" fill="${C.muted}">parágrafo · conversa</text>
    <text x="30" y="528" ${mono} font-size="13" fill="${C.muted}">leitura longa</text>
    <text x="30" y="566" ${mono} font-size="12" fill="${C.purple}">400 / 700 · 12–36px</text>
  </g>
  <g transform="translate(1070 245)">
    <rect width="450" height="590" rx="26" fill="${C.pale}"/>
    <text x="30" y="48" ${font} font-size="14" font-weight="700" letter-spacing="3" fill="${C.purple}">PRECISÃO E REGISTRO</text>
    <text x="30" y="108" ${mono} font-size="27" font-weight="600" fill="${C.deep}">Source Code Pro</text>
    <text x="30" y="142" ${mono} font-size="15" fill="${C.purple}">21 AGO · 09:42 · 24px</text>
    <line x1="30" y1="178" x2="420" y2="178" stroke="${C.soft}"/>
    <text x="30" y="220" ${font} font-size="14" font-weight="700" fill="${C.purple}">USAR EM</text>
    <text x="30" y="262" ${mono} font-size="17" fill="${C.deep}">data e horário</text>
    <text x="30" y="302" ${mono} font-size="17" fill="${C.deep}">tokens e medidas</text>
    <text x="30" y="342" ${mono} font-size="17" fill="${C.deep}">hex e IDs</text>
    <text x="30" y="382" ${mono} font-size="17" fill="${C.deep}">proveniência</text>
    <line x1="30" y1="420" x2="420" y2="420" stroke="${C.soft}"/>
    <text x="30" y="460" ${font} font-size="14" font-weight="700" fill="${C.red}">NÃO USAR EM</text>
    <text x="30" y="500" ${mono} font-size="13" fill="${C.muted}">título · botão · corpo</text>
    <text x="30" y="530" ${mono} font-size="13" fill="${C.muted}">ação principal</text>
    <text x="30" y="566" ${mono} font-size="12" fill="${C.purple}">400–600 · 11–13px</text>
  </g>`));

pages.push(base(9, '08 · Hierarquia', 'Contraste editorial, não excesso.', `
  <g transform="translate(80 220)">
    <text x="0" y="78" ${serif} font-size="82" letter-spacing="-3" fill="${C.ink}">Display XL · 72 / 400</text>
    <text x="1110" y="68" ${mono} font-size="13" fill="${C.muted}">STIX · 0.96 · -0.03em</text>
    <line x1="0" y1="105" x2="1440" y2="105" stroke="${C.line}"/>
    <text x="0" y="174" ${serif} font-size="48" font-weight="500" fill="${C.ink}">Headline · 40 / 500</text>
    <text x="1110" y="167" ${mono} font-size="13" fill="${C.muted}">STIX · 1.08</text>
    <line x1="0" y1="201" x2="1440" y2="201" stroke="${C.line}"/>
    <text x="0" y="263" ${font} font-size="36" font-weight="700" letter-spacing="1" fill="${C.ink}">UTILITY XL · 36 / 700</text>
    <text x="1110" y="256" ${mono} font-size="13" fill="${C.muted}">NIMBUS NARROW · 1.00</text>
    <line x1="0" y1="291" x2="1440" y2="291" stroke="${C.line}"/>
    <text x="0" y="349" ${serif} font-size="28" font-weight="600" fill="${C.ink}">Card title · 26 / 600</text>
    <text x="1110" y="343" ${mono} font-size="13" fill="${C.muted}">STIX · 1.20</text>
    <line x1="0" y1="377" x2="1440" y2="377" stroke="${C.line}"/>
    <text x="0" y="430" ${serif} font-size="20" fill="${C.ink}">Body large · 19 / 400 · leitura e conversa com linha generosa.</text>
    <text x="1110" y="424" ${mono} font-size="13" fill="${C.muted}">STIX · 1.55</text>
    <line x1="0" y1="460" x2="1440" y2="460" stroke="${C.line}"/>
    <text x="0" y="510" ${font} font-size="18" font-weight="700" letter-spacing="2" fill="${C.ink}">LABEL · 14 / 700 · AÇÃO OU ESTADO</text>
    <text x="1110" y="504" ${mono} font-size="13" fill="${C.muted}">NIMBUS · 1.15</text>
    <line x1="0" y1="540" x2="1440" y2="540" stroke="${C.line}"/>
    <text x="0" y="586" ${mono} font-size="14" fill="${C.muted}">CAPTION · 12 / 500 · 21 AGO 2026 · 10:42</text>
    <text x="1110" y="580" ${mono} font-size="13" fill="${C.muted}">SOURCE CODE · 1.40</text>
  </g>
  <g transform="translate(80 835)">
    <text ${mono} font-size="13" fill="${C.purple}">ORDEM</text>
    <text x="88" ${serif} font-size="19" fill="${C.ink}">tamanho → peso → espaço → linha → cor</text>
  </g>`));

pages.push(base(10, '09 · Medidas e grid', 'Precisão por baixo da leveza.', `
  <g transform="translate(80 225)">
    <text ${font} font-size="16" font-weight="700" letter-spacing="2" fill="${C.mid}">GRID DESKTOP · 12 COLUNAS · MARGEM 64 · GUTTER 24</text>
    ${Array.from({length:12},(_,i)=>`<rect x="${i*120}" y="42" width="96" height="210" fill="${i%2?C.pale:C.soft}" opacity="${i%2?0.75:0.45}"/><text x="${i*120+48}" y="158" text-anchor="middle" ${mono} font-size="13" fill="${C.deep}">${String(i+1).padStart(2,'0')}</text>`).join('')}
    <line x1="0" y1="280" x2="1440" y2="280" stroke="${C.ink}" stroke-width="2"/>
    <line x1="0" y1="268" x2="0" y2="292" stroke="${C.ink}"/><line x1="1440" y1="268" x2="1440" y2="292" stroke="${C.ink}"/>
    <text x="720" y="308" text-anchor="middle" ${mono} font-size="13" fill="${C.muted}">CONTAINER MÁXIMO · 1440px</text>
  </g>
  <g transform="translate(80 585)">
    <text ${font} font-size="16" font-weight="700" letter-spacing="2" fill="${C.mid}">ESPAÇAMENTO</text>
    ${[4,8,12,16,24,32,48,64,80,96].map((v,i)=>`<g transform="translate(${i*105} 38)"><rect width="${Math.max(8,v/2)}" height="${Math.max(8,v/2)}" rx="3" fill="${i<4?C.soft:C.purple}"/><text x="0" y="94" ${mono} font-size="13" fill="${C.ink}">${v}</text></g>`).join('')}
  </g>
  <g transform="translate(1130 585)">
    <text ${font} font-size="16" font-weight="700" letter-spacing="2" fill="${C.mid}">FORMA</text>
    <rect y="40" width="90" height="90" rx="8" fill="${C.pale}"/><text x="45" y="90" text-anchor="middle" ${mono} font-size="12" fill="${C.deep}">R8</text>
    <rect x="110" y="40" width="90" height="90" rx="16" fill="${C.pale}"/><text x="155" y="90" text-anchor="middle" ${mono} font-size="12" fill="${C.deep}">R16</text>
    <rect x="220" y="40" width="90" height="90" rx="24" fill="${C.pale}"/><text x="265" y="90" text-anchor="middle" ${mono} font-size="12" fill="${C.deep}">R24</text>
    <text y="170" ${mono} font-size="12" fill="${C.muted}">stroke 1px · focus 3px</text>
  </g>
  <line x1="80" y1="825" x2="1520" y2="825" stroke="${C.line}"/>
  <text x="80" y="860" ${mono} font-size="13" fill="${C.muted}">MOBILE 20 / 4 col / 16 gutter    ·    TABLET 32 / 8 col / 20 gutter    ·    DESKTOP 64 / 12 col / 24 gutter</text>`));

pages.push(base(11, '10 · Cards', 'Anatomia antes da decoração.', `
  <g transform="translate(265 250)">
    <rect width="1070" height="420" rx="20" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <text x="32" y="48" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.mid}">OVERLINE · NIMBUS 14 / 700</text>
    <text x="32" y="115" ${serif} font-size="36" font-weight="600" fill="${C.ink}">Título editorial do card</text>
    <text x="32" y="168" ${serif} font-size="20" fill="${C.ink}">Texto principal com largura controlada e ritmo de leitura.</text>
    <text x="32" y="202" ${serif} font-size="20" fill="${C.ink}">Uma segunda linha preserva o respiro interno.</text>
    <line x1="32" y1="244" x2="1038" y2="244" stroke="${C.line}"/>
    <text x="32" y="286" ${mono} font-size="13" fill="${C.muted}">21 AGO 2026 · 10:42 · ORIGEM VERIFICADA</text>
    <rect x="32" y="330" width="190" height="50" rx="12" fill="${C.purple}"/><text x="127" y="361" text-anchor="middle" ${font} font-size="16" font-weight="700" fill="${C.white}">AÇÃO PRINCIPAL</text>
    <text x="1008" y="362" text-anchor="end" ${font} font-size="26" fill="${C.purple}">→</text>
    <line x1="0" y1="-28" x2="1070" y2="-28" stroke="${C.purple}"/>
    <line x1="0" y1="-38" x2="0" y2="-18" stroke="${C.purple}"/><line x1="1070" y1="-38" x2="1070" y2="-18" stroke="${C.purple}"/>
    <text x="535" y="-42" text-anchor="middle" ${mono} font-size="13" fill="${C.purple}">LARGURA FLUIDA · MÁX. 1070</text>
    <line x1="-28" y1="0" x2="-28" y2="420" stroke="${C.purple}"/>
    <line x1="-38" y1="0" x2="-18" y2="0" stroke="${C.purple}"/><line x1="-38" y1="420" x2="-18" y2="420" stroke="${C.purple}"/>
    <text x="-48" y="210" text-anchor="middle" transform="rotate(-90 -48 210)" ${mono} font-size="13" fill="${C.purple}">ALTURA CONFORME CONTEÚDO</text>
  </g>
  <g transform="translate(80 750)">
    <text ${mono} font-size="13" fill="${C.purple}">PADDING</text><text x="92" ${serif} font-size="18" fill="${C.ink}">24 padrão · 32 editorial</text>
    <text x="390" ${mono} font-size="13" fill="${C.purple}">GAPS</text><text x="450" ${serif} font-size="18" fill="${C.ink}">8 · 12 · 16</text>
    <text x="690" ${mono} font-size="13" fill="${C.purple}">RAIO</text><text x="750" ${serif} font-size="18" fill="${C.ink}">16 funcional · 24 editorial</text>
    <text x="1110" ${mono} font-size="13" fill="${C.purple}">BORDA</text><text x="1180" ${serif} font-size="18" fill="${C.ink}">1px paper-200</text>
  </g>
  <text x="80" y="862" ${font} font-size="17" fill="${C.muted}">Ordem fixa: overline → título → corpo → metadado → ação.</text>`));

pages.push(base(12, '11 · Cards', 'Variações com função definida.', `
  <g transform="translate(80 225)">
    <g><rect width="690" height="270" rx="18" fill="${C.white}" stroke="${C.line}"/><text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.mid}">SURFACE · PAD 24 · R16</text><text x="28" y="104" ${serif} font-size="30" font-weight="600" fill="${C.ink}">Card funcional padrão</text><text x="28" y="150" ${serif} font-size="18" fill="${C.ink}">Agrupa conteúdo sem disputar atenção.</text><line x1="28" y1="190" x2="662" y2="190" stroke="${C.line}"/><text x="28" y="230" ${mono} font-size="12" fill="${C.muted}">paper-0 · border paper-200 · sem sombra</text></g>
    <g transform="translate(750 0)"><rect width="690" height="270" rx="24" fill="${C.pale}"/><text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.purple}">EDITORIAL · PAD 32 · R24</text><text x="28" y="112" ${serif} font-size="40" font-style="italic" fill="${C.deep}">Uma pausa na leitura.</text><text x="28" y="164" ${serif} font-size="18" fill="${C.deep}">Destaque de conteúdo, nunca ação crítica.</text><text x="28" y="226" ${mono} font-size="12" fill="${C.purple}">purple-100 · tipografia expressiva</text></g>
    <g transform="translate(0 310)"><rect width="690" height="270" rx="18" fill="${C.white}" stroke="${C.purple}" stroke-width="2"/><text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.mid}">INTERATIVO · MIN-H 144</text><text x="28" y="104" ${serif} font-size="30" font-weight="600" fill="${C.ink}">Título com destino claro</text><text x="28" y="150" ${serif} font-size="18" fill="${C.ink}">O foco envolve todo o card e a seta permanece visível.</text><text x="640" y="224" text-anchor="end" ${font} font-size="30" fill="${C.purple}">→</text><text x="28" y="226" ${mono} font-size="12" fill="${C.muted}">focus ring 3px · alvo mínimo 44px</text></g>
    <g transform="translate(750 310)"><rect width="690" height="270" rx="18" fill="${C.ink}"/><text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.soft}">INVERSO · USO RESTRITO</text><text x="28" y="106" ${serif} font-size="32" fill="${C.ivory}">Contraste para uma informação.</text><text x="28" y="154" ${serif} font-size="18" fill="${C.ivory}">Não criar uma grade inteira de cards escuros.</text><line x1="28" y1="190" x2="662" y2="190" stroke="#514853"/><text x="28" y="230" ${mono} font-size="12" fill="${C.soft}">ink-900 · texto paper · semântica explícita</text></g>
  </g>
  <text x="80" y="862" ${font} font-size="17" fill="${C.muted}">Um card muda de aparência apenas quando muda de intenção.</text>`));

pages.push(base(13, '12 / Composição', 'A página de jornal como sistema.', `
  <g transform="translate(80 215)">
    <rect width="1440" height="650" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>
    <line x1="28" y1="44" x2="1412" y2="44" stroke="${C.ink}"/>
    <text x="28" y="30" ${mono} font-size="11" fill="${C.ink}">SINAPSA. · CADERNO DE CONTEXTO</text>
    <text x="1412" y="30" text-anchor="end" ${mono} font-size="11" fill="${C.ink}">21 AGO 2026 · Nº 001</text>
    <text x="28" y="112" ${font} font-size="14" font-weight="700" letter-spacing="4" fill="${C.purple}">O QUE ACONTECE ENTRE SESSÕES</text>
    <text x="28" y="202" ${serif} font-size="80" letter-spacing="-3" fill="${C.ink}">Contexto muda</text>
    <text x="28" y="278" ${serif} font-size="80" letter-spacing="-3" fill="${C.ink}">a conversa.</text>
    <line x1="28" y1="312" x2="1412" y2="312" stroke="${C.ink}" stroke-width="3"/>
    <g transform="translate(28 344)">
      <text ${serif} font-size="54" fill="${C.purple}">S</text><text x="38" y="0" ${serif} font-size="17" fill="${C.ink}">inapsa organiza relatos ao longo do tempo</text><text x="38" y="26" ${serif} font-size="17" fill="${C.ink}">sem transformar inferências em fatos clínicos.</text>
      <text y="72" ${serif} font-size="17" fill="${C.ink}">A composição usa colunas estreitas, fios finos,</text><text y="98" ${serif} font-size="17" fill="${C.ink}">títulos amplos e metadados precisos.</text>
    </g>
    <line x1="370" y1="344" x2="370" y2="618" stroke="${C.line}"/>
    <g transform="translate(400 350)"><text ${font} font-size="13" font-weight="700" letter-spacing="2" fill="${C.mid}">HIERARQUIA</text><text y="54" ${serif} font-size="22" font-style="italic" fill="${C.ink}">Uma ideia dominante.</text><text y="90" ${serif} font-size="17" fill="${C.ink}">O restante apoia, explica</text><text y="116" ${serif} font-size="17" fill="${C.ink}">e oferece precisão.</text><line y1="146" x2="280" y2="146" stroke="${C.line}"/><text y="180" ${mono} font-size="12" fill="${C.muted}">1 display / 1 overline</text><text y="206" ${mono} font-size="12" fill="${C.muted}">2–4 colunas / fio 1px</text></g>
    <rect x="735" y="344" width="320" height="274" fill="${C.pale}"/>
    <text x="760" y="382" ${font} font-size="13" font-weight="700" letter-spacing="2" fill="${C.purple}">PULL QUOTE</text>
    <text x="760" y="442" ${serif} font-size="31" font-style="italic" fill="${C.deep}">“Espaço também</text><text x="760" y="480" ${serif} font-size="31" font-style="italic" fill="${C.deep}">é hierarquia.”</text>
    <line x1="760" y1="526" x2="1030" y2="526" stroke="${C.soft}"/>
    <text x="760" y="561" ${mono} font-size="11" fill="${C.purple}">STIX ITALIC · 31 / 1.2</text>
    <line x1="1085" y1="344" x2="1085" y2="618" stroke="${C.line}"/>
    <g transform="translate(1115 350)"><text ${font} font-size="13" font-weight="700" letter-spacing="2" fill="${C.mid}">REGRAS</text><text y="50" ${mono} font-size="12" fill="${C.ink}">MARGEM 28</text><text y="80" ${mono} font-size="12" fill="${C.ink}">GUTTER 24</text><text y="110" ${mono} font-size="12" fill="${C.ink}">LINHA 1 / 3</text><text y="140" ${mono} font-size="12" fill="${C.ink}">COLUNA 318</text><text y="190" ${font} font-size="16" fill="${C.purple}">Título amplo.</text><text y="218" ${font} font-size="16" fill="${C.purple}">Cor pontual.</text><text y="246" ${font} font-size="16" fill="${C.purple}">Texto respirando.</text></g>
  </g>`));

pages.push(base(14, '13 · Light mode', 'Papel, não branco.', `
  <text x="80" y="205" ${serif} font-size="20" fill="${C.muted}">Superfícies quentes preservam a estética editorial sem reduzir contraste.</text>
  <g transform="translate(80 245)">
    <text ${font} font-size="15" font-weight="700" letter-spacing="3" fill="${C.mid}">CAMADAS</text>
    <g transform="translate(0 35)"><rect width="260" height="150" rx="18" fill="${C.paper}" stroke="${C.line}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.ink}">Canvas</text><text x="20" y="130" ${mono} font-size="12" fill="${C.muted}">#F1E5CD</text></g>
    <g transform="translate(285 35)"><rect width="260" height="150" rx="18" fill="${C.white}" stroke="${C.line}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.ink}">Surface</text><text x="20" y="130" ${mono} font-size="12" fill="${C.muted}">#FAF4E8</text></g>
    <g transform="translate(570 35)"><rect width="260" height="150" rx="18" fill="${C.ivory}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.ink}">Subtle</text><text x="20" y="130" ${mono} font-size="12" fill="${C.ink}">#E7D7B8</text></g>
    <g transform="translate(855 35)"><rect width="260" height="150" rx="18" fill="${C.ink}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.ivory}">Ink</text><text x="20" y="130" ${mono} font-size="12" fill="${C.soft}">#1D191E</text></g>
    <g transform="translate(1140 35)"><rect width="300" height="150" rx="18" fill="${C.purple}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.white}">Primary</text><text x="20" y="130" ${mono} font-size="12" fill="${C.pale}">#604174</text></g>
  </g>
  <g transform="translate(80 490)">
    <rect width="900" height="310" rx="22" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.mid}">COMPONENTES SOBRE SURFACE</text>
    <text x="28" y="100" ${serif} font-size="30" font-weight="600" fill="${C.ink}">Título principal do card</text>
    <text x="28" y="140" ${serif} font-size="18" fill="${C.ink}">Texto de leitura usa ink-900. Apoio usa ink-500.</text>
    <rect x="28" y="176" width="460" height="56" rx="12" fill="${C.white}" stroke="#947449" stroke-width="2"/>
    <text x="46" y="211" ${font} font-size="17" fill="${C.muted}">Campo com borda acessível</text>
    <rect x="516" y="176" width="210" height="56" rx="12" fill="${C.purple}"/><text x="621" y="211" text-anchor="middle" ${font} font-size="17" font-weight="700" fill="${C.white}">AÇÃO PRIMÁRIA</text>
    <rect x="748" y="176" width="120" height="56" rx="12" fill="${C.white}" stroke="${C.purple}" stroke-width="3"/><text x="808" y="211" text-anchor="middle" ${font} font-size="17" font-weight="700" fill="${C.purple}">FOCO</text>
    <text x="28" y="272" ${mono} font-size="12" fill="${C.muted}">border-control #947449 · focus #765292 / 3px · radius 12</text>
  </g>
  <g transform="translate(1030 490)">
    <text ${font} font-size="15" font-weight="700" letter-spacing="2" fill="${C.mid}">CONTRASTE</text>
    <text y="60" ${mono} font-size="14" fill="${C.ink}">ink / canvas</text><text x="430" y="60" text-anchor="end" ${mono} font-size="14" fill="${C.green}">13.91:1</text>
    <line y1="82" x2="430" y2="82" stroke="${C.line}"/>
    <text y="126" ${mono} font-size="14" fill="${C.ink}">purple / surface</text><text x="430" y="126" text-anchor="end" ${mono} font-size="14" fill="${C.green}">7.65:1</text>
    <line y1="148" x2="430" y2="148" stroke="${C.line}"/>
    <text y="192" ${mono} font-size="14" fill="${C.ink}">ink-500 / canvas</text><text x="430" y="192" text-anchor="end" ${mono} font-size="14" fill="${C.green}">4.68:1</text>
    <line y1="214" x2="430" y2="214" stroke="${C.line}"/>
    <text y="258" ${font} font-size="16" fill="${C.muted}">Sem branco puro.</text>
  </g>`));

pages.push(base(15, '14 · Dark mode', 'Obsidiana, não preto.', `
  <text x="80" y="205" ${serif} font-size="20" fill="${C.darkTextSecondary}">Elevação vem de camadas quentes, bordas e contraste — nunca de preto absoluto.</text>
  <g transform="translate(80 245)">
    <text ${font} font-size="15" font-weight="700" letter-spacing="3" fill="${C.soft}">CAMADAS</text>
    <g transform="translate(0 35)"><rect width="260" height="150" rx="18" fill="${C.darkCanvas}" stroke="${C.darkBorder}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.darkText}">Canvas</text><text x="20" y="130" ${mono} font-size="12" fill="${C.darkTextSecondary}">#181519</text></g>
    <g transform="translate(285 35)"><rect width="260" height="150" rx="18" fill="${C.darkSubtle}" stroke="${C.darkBorder}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.darkText}">Subtle</text><text x="20" y="130" ${mono} font-size="12" fill="${C.darkTextSecondary}">#201C22</text></g>
    <g transform="translate(570 35)"><rect width="260" height="150" rx="18" fill="${C.darkSurface}" stroke="${C.darkBorder}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.darkText}">Surface</text><text x="20" y="130" ${mono} font-size="12" fill="${C.darkTextSecondary}">#28222B</text></g>
    <g transform="translate(855 35)"><rect width="260" height="150" rx="18" fill="${C.darkElevated}" stroke="${C.darkBorder}"/><text x="20" y="102" ${font} font-size="22" font-weight="700" fill="${C.darkText}">Elevated</text><text x="20" y="130" ${mono} font-size="12" fill="${C.darkTextSecondary}">#302833</text></g>
    <g transform="translate(1140 35)"><rect width="300" height="150" rx="18" fill="${C.darkPrimary}"/><text x="20" y="74" ${font} font-size="22" font-weight="700" fill="${C.white}">Primary</text><text x="20" y="104" ${mono} font-size="12" fill="${C.white}">#655A7C / #FAF4E8</text><text x="20" y="130" ${mono} font-size="10" fill="${C.pale}">H #765292 · P #4B315C</text></g>
  </g>
  <g transform="translate(80 490)">
    <rect width="900" height="310" rx="22" fill="${C.darkSurface}" stroke="${C.darkBorder}" stroke-width="2"/>
    <text x="28" y="44" ${font} font-size="14" font-weight="700" letter-spacing="2" fill="${C.soft}">COMPONENTES SOBRE SURFACE</text>
    <text x="28" y="100" ${serif} font-size="30" font-weight="600" fill="${C.darkText}">Título principal do card</text>
    <text x="28" y="140" ${serif} font-size="18" fill="${C.darkTextSecondary}">Texto secundário permanece quente e altamente legível.</text>
    <rect x="28" y="176" width="460" height="56" rx="12" fill="${C.darkSurface}" stroke="${C.darkControl}" stroke-width="2"/>
    <text x="46" y="211" ${font} font-size="17" fill="${C.darkTextSecondary}">Campo com borda acessível</text>
    <rect x="516" y="176" width="210" height="56" rx="12" fill="${C.darkPrimary}"/><text x="621" y="211" text-anchor="middle" ${font} font-size="17" font-weight="700" fill="${C.white}">AÇÃO PRIMÁRIA</text>
    <rect x="748" y="176" width="120" height="56" rx="12" fill="${C.darkSurface}" stroke="${C.pale}" stroke-width="3"/><text x="808" y="211" text-anchor="middle" ${font} font-size="17" font-weight="700" fill="${C.pale}">FOCO</text>
    <text x="28" y="272" ${mono} font-size="12" fill="${C.darkTextSecondary}">border-control #7C697F · focus #DCCDE8 / 3px · sem sombra preta</text>
  </g>
  <g transform="translate(1030 490)">
    <text ${font} font-size="15" font-weight="700" letter-spacing="2" fill="${C.soft}">SEMÂNTICAS</text>
    <g transform="translate(0 34)"><rect width="205" height="78" rx="14" fill="#1D3028"/><circle cx="24" cy="24" r="7" fill="#8FC8AD"/><text x="42" y="30" ${font} font-size="16" font-weight="700" fill="#8FC8AD">Sucesso</text><text x="18" y="60" ${mono} font-size="11" fill="#8FC8AD">7.33:1</text></g>
    <g transform="translate(225 34)"><rect width="205" height="78" rx="14" fill="#352A17"/><circle cx="24" cy="24" r="7" fill="#E4C57E"/><text x="42" y="30" ${font} font-size="16" font-weight="700" fill="#E4C57E">Atenção</text><text x="18" y="60" ${mono} font-size="11" fill="#E4C57E">8.42:1</text></g>
    <g transform="translate(0 132)"><rect width="205" height="78" rx="14" fill="#382024"/><circle cx="24" cy="24" r="7" fill="#E5A0A8"/><text x="42" y="30" ${font} font-size="16" font-weight="700" fill="#E5A0A8">Erro</text><text x="18" y="60" ${mono} font-size="11" fill="#E5A0A8">7.09:1</text></g>
    <g transform="translate(225 132)"><rect width="205" height="78" rx="14" fill="#1D2D36"/><circle cx="24" cy="24" r="7" fill="#9EC7DE"/><text x="42" y="30" ${font} font-size="16" font-weight="700" fill="#9EC7DE">Informação</text><text x="18" y="60" ${mono} font-size="11" fill="#9EC7DE">7.89:1</text></g>
    <text y="258" ${font} font-size="16" fill="${C.darkTextSecondary}">Sem inversão automática.</text>
  </g>`, { bg: C.darkCanvas, light: true }));

for (const [index, svg] of pages.entries()) {
  fs.writeFileSync(path.join(out, `${String(index + 1).padStart(2, '0')}.svg`), svg.trim() + '\n');
}

console.log(`Generated ${pages.length} SVG pages in ${out}`);
