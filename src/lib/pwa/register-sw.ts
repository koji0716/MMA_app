export function registerSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker?.addEventListener("controllerchange", () => {
      console.log("App updated.");
    });
  });
}
