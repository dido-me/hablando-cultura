// Botón "Continuar con Google" (Google Identity Services). Google entrega un ID token en
// el navegador y la API lo cambia por el mismo token de sesión que el login con correo.
// No aparece mientras PUBLIC_GOOGLE_CLIENT_ID esté vacío.

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, saveSession } from '../../lib/platform/api';
import type { AuthToken } from '../../lib/platform/types';
import { Alert } from './ui';

const CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: { client_id: string; callback: (response: { credential: string }) => void; ux_mode?: string }): void;
          renderButton(element: HTMLElement, options: Record<string, unknown>): void;
        };
      };
    };
  }
}

let script: Promise<void> | null = null;

function loadScript() {
  script ??= new Promise((resolve, reject) => {
    const tag = document.createElement('script');
    tag.src = 'https://accounts.google.com/gsi/client';
    tag.async = true;
    tag.onload = () => resolve();
    tag.onerror = () => reject(new Error('No se pudo cargar Google'));
    document.head.appendChild(tag);
  });
  return script;
}

export default function GoogleButton({ onSignedIn }: { onSignedIn: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CLIENT_ID) return;

    loadScript()
      .then(() => {
        if (!window.google || !container.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            setError('');
            try {
              const data = await api<{ authentication_token: AuthToken }>('/v1/tokens/google', { method: 'POST', body: { id_token: credential } });
              saveSession(data.authentication_token);
              onSignedIn();
            } catch (err) {
              setError(err instanceof ApiError ? err.message : 'No pudimos ingresar con Google.');
            }
          },
        });
        window.google.accounts.id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'es',
          width: container.current.offsetWidth || 320,
        });
      })
      .catch(() => setError('No se pudo cargar el botón de Google. Ingresa con tu correo.'));
  }, [onSignedIn]);

  if (!CLIENT_ID) return null;

  return (
    <div className="space-y-3">
      <div ref={container} className="flex min-h-[44px] w-full justify-center" />
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />o con tu correo<span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}
