let loadPromise: Promise<NonNullable<Window["google"]>> | null = null;

/** Carrega o script do Google Identity Services (GSI) sob demanda, uma única vez. */
export function loadGoogleIdentityServices(): Promise<NonNullable<Window["google"]>> {
  if (window.google?.accounts) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts) resolve(window.google);
      else reject(new Error("Google Identity Services indisponível"));
    };
    script.onerror = () => reject(new Error("Falha ao carregar o script do Google"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
