"use client";

import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

/* Registro único dos plugins.

   Todo módulo de motion importa GSAP daqui, nunca de "gsap" direto: assim o
   registro acontece exatamente uma vez, antes de qualquer timeline, e não
   depende da ordem em que os componentes são carregados.

   Só entram plugins com uso real:

   - `Flip`  — o indicador da conversa ativa muda de geometria (posição e
               altura) entre itens de tamanhos diferentes. É o único lugar
               onde precisamos medir antes/depois; nas abas a geometria de
               repouso é conhecida (§ MOTION.md, "Por que as abas não usam
               Flip").
   - `useGSAP` — registrado para que `gsap.registerPlugin` conheça o hook e
               o cleanup automático valha em todo o app. */
gsap.registerPlugin(Flip, useGSAP);

export { gsap, Flip, useGSAP };
