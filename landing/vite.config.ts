import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

/* Build estático. A landing é servida por um Worker próprio em siouve.com,
   mas isso é configuração de deploy e fica para depois — aqui só sai `dist/`.

   `three` e `gsap` viram chunks próprios: juntos passam de 600kB e não
   precisam bloquear o primeiro paint do texto, que é o que importa. */
/* A porta vive aqui, e só aqui.

   3000 é o app do paciente e 3001 o do profissional; a landing fica na
   seguinte. `strictPort` é deliberado: se a 3002 estiver ocupada, é melhor
   falhar do que o Vite escolher outra porta em silêncio e o `dev:design` da
   raiz anunciar um endereço que não é o que subiu.

   Por estar na config e não no script, `npm run dev` dentro de `landing/` e
   `pnpm dev:design` na raiz sobem exatamente no mesmo lugar. */
const PORT = 3002;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: PORT, strictPort: true },
  preview: { port: PORT, strictPort: true },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    target: "es2022",
    cssTarget: "safari16",
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          gsap: ["gsap", "gsap/ScrollTrigger", "gsap/SplitText"],
        },
      },
    },
  },
});
