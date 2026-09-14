import { lazy, Suspense, useCallback, useState } from "react";

import { Doors } from "./components/Doors";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Interval } from "./components/Interval";
import { Nav } from "./components/Nav";
import { Offer } from "./components/Offer";
import { Preloader } from "./components/Preloader";
import { Report } from "./components/Report";
import { Who } from "./components/Who";

/* O WebGL entra por `lazy`, e isso é decisão de conteúdo, não de build.

   `three` é o maior pedaço do bundle e não desenha uma única palavra da
   página. Tirá-lo do caminho crítico é o que garante que a manchete pinte
   primeiro; o campo de orbes chega em seguida, por cima do gradiente CSS que
   já estava lá. */
const Stage = lazy(() =>
  import("./webgl/Stage").then((module) => ({ default: module.Stage })),
);

export function App() {
  /* Dois estados, e a ordem entre eles é o que conserta a travada da
     abertura: o palco avisa quando desenhou o primeiro quadro, a cortina
     sobe, e só então o masthead começa a se montar. Antes, as três coisas
     disputavam o mesmo instante. */
  const [stageReady, setStageReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const onStageReady = useCallback(() => setStageReady(true), []);
  const onRevealed = useCallback(() => setRevealed(true), []);

  return (
    <>
      <Suspense fallback={null}>
        <Stage onReady={onStageReady} />
      </Suspense>

      <Preloader ready={stageReady} onDone={onRevealed} />

      <Nav />

      <main id="conteudo">
        <Hero start={revealed} />
        <Interval />
        <Who />
        <Offer />
        <Report />
        <Doors />
      </main>

      <Footer />
    </>
  );
}
