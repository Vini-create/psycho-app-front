"use client";

import { useEffect, useState } from "react";
import { Button, Icon, Modal, cx } from "@sinapsa/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let serviceWorkerRegistrationStarted = false;
const availabilityListeners = new Set<(available: boolean) => void>();

function publishAvailability(available: boolean) {
  availabilityListeners.forEach((listener) => listener(available));
}

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIosDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent);
}

function isChromeBrowser() {
  return (
    /Chrome\//i.test(navigator.userAgent) &&
    !/EdgA|OPR|Opera|SamsungBrowser|DuckDuckGo/i.test(navigator.userAgent)
  );
}

function shouldOpenInChrome() {
  return isAndroidDevice() && !isChromeBrowser() && !isRunningStandalone();
}

function openCurrentPageInChrome() {
  const { host, pathname, search, protocol } = window.location;
  const scheme = protocol.replace(":", "");
  const fallback = encodeURIComponent(
    "https://play.google.com/store/apps/details?id=com.android.chrome",
  );

  window.location.href =
    `intent://${host}${pathname}${search}` +
    `#Intent;scheme=${scheme};package=com.android.chrome;` +
    `S.browser_fallback_url=${fallback};end`;
}

function prepareServiceWorker() {
  if (!("serviceWorker" in navigator) || serviceWorkerRegistrationStarted) return;
  serviceWorkerRegistrationStarted = true;

  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
    // O botão continua oferecendo o caminho manual caso o navegador bloqueie
    // o registro ou demore para liberar o prompt nativo.
  });
}

export function InstallAppButton({
  className,
  labelClassName,
}: {
  className?: string;
  labelClassName?: string;
}) {
  const [nativePromptAvailable, setNativePromptAvailable] = useState(false);
  const [iosInstallAvailable, setIosInstallAvailable] = useState(false);
  const [androidInstallAvailable, setAndroidInstallAvailable] = useState(false);
  const [chromeRedirectAvailable, setChromeRedirectAvailable] = useState(false);
  const [iosInstructionsOpen, setIosInstructionsOpen] = useState(false);
  const [androidInstructionsOpen, setAndroidInstructionsOpen] = useState(false);
  const [chromeConfirmationOpen, setChromeConfirmationOpen] = useState(false);

  useEffect(() => {
    prepareServiceWorker();

    const availabilityFrame = window.requestAnimationFrame(() => {
      const standalone = isRunningStandalone();
      setNativePromptAvailable(Boolean(deferredInstallPrompt) && !standalone);
      setIosInstallAvailable(isIosDevice() && !standalone);
      setAndroidInstallAvailable(isAndroidDevice() && !standalone);
      setChromeRedirectAvailable(shouldOpenInChrome());
    });

    availabilityListeners.add(setNativePromptAvailable);

    function handleInstallPrompt(event: Event) {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;
      publishAvailability(!isRunningStandalone());
    }

    function handleInstalled() {
      deferredInstallPrompt = null;
      setIosInstallAvailable(false);
      setAndroidInstallAvailable(false);
      setChromeRedirectAvailable(false);
      publishAvailability(false);
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(availabilityFrame);
      availabilityListeners.delete(setNativePromptAvailable);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    /* Samsung Internet também pode expor `beforeinstallprompt`, mas nesse
       caso quem empacota o site é o instalador do próprio navegador. Em
       versões que geram um pacote Android antigo, o Play Protect o bloqueia.
       No Android fora do Chrome, abrimos a mesma origem no Chrome antes de
       considerar qualquer prompt nativo recebido. */
    if (chromeRedirectAvailable) {
      setChromeConfirmationOpen(true);
      return;
    }

    const prompt = deferredInstallPrompt;

    if (!prompt) {
      if (iosInstallAvailable) setIosInstructionsOpen(true);
      else if (androidInstallAvailable) setAndroidInstructionsOpen(true);
      return;
    }

    try {
      await prompt.prompt();
      await prompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      publishAvailability(false);
    }
  }

  if (
    !nativePromptAvailable &&
    !iosInstallAvailable &&
    !androidInstallAvailable &&
    !chromeRedirectAvailable
  ) {
    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => void install()}
        startIcon={<Icon name="install" size={16} />}
        className={cx("shrink-0", className)}
        aria-label="Baixar app"
        title="Baixar app"
      >
        <span className={labelClassName}>Baixar app</span>
      </Button>

      <Modal
        open={chromeConfirmationOpen}
        onClose={() => setChromeConfirmationOpen(false)}
        title="Instalar pelo Chrome"
        description="Para usar o instalador compatível com as proteções atuais do Android, vamos abrir esta mesma página no Chrome."
        footer={
          <>
            <Button variant="text" onClick={() => setChromeConfirmationOpen(false)}>
              Agora não
            </Button>
            <Button onClick={openCurrentPageInChrome}>Abrir no Chrome</Button>
          </>
        }
      />

      <Modal
        open={iosInstructionsOpen}
        onClose={() => setIosInstructionsOpen(false)}
        title="Coloque a Siouve na tela inicial"
        description="No iPhone ou iPad, a instalação é concluída pelo menu de compartilhamento do navegador."
        footer={
          <Button onClick={() => setIosInstructionsOpen(false)}>Entendi</Button>
        }
      >
        <ol className="flex flex-col gap-3">
          {[
            "Toque no botão Compartilhar do navegador.",
            "Escolha Adicionar à Tela de Início.",
            "Confirme em Adicionar.",
          ].map((step, index) => (
            <li
              key={step}
              className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 border-t border-hairline pt-3 first:border-t-0 first:pt-0"
            >
              <span className="type-meta flex size-8 items-center justify-center rounded-full bg-action text-on-action">
                {index + 1}
              </span>
              <span className="text-ui text-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </Modal>

      <Modal
        open={androidInstructionsOpen}
        onClose={() => setAndroidInstructionsOpen(false)}
        title="Instale a Siouve pelo Chrome"
        description="Se a confirmação automática ainda não apareceu, conclua pelo menu do Chrome."
        footer={
          <Button onClick={() => setAndroidInstructionsOpen(false)}>Entendi</Button>
        }
      >
        <ol className="flex flex-col gap-3">
          {[
            "Toque nos três pontos do Chrome.",
            "Escolha Instalar app ou Adicionar à tela inicial.",
            "Confirme em Instalar.",
          ].map((step, index) => (
            <li
              key={step}
              className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-3 border-t border-hairline pt-3 first:border-t-0 first:pt-0"
            >
              <span className="type-meta flex size-8 items-center justify-center rounded-full bg-action text-on-action">
                {index + 1}
              </span>
              <span className="text-ui text-secondary">{step}</span>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}
