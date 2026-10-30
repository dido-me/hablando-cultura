// Descarga de un archivo comprado (el ebook o un material del curso): pide a la API un
// enlace de cinco minutos al archivo privado y lo descarga. El archivo nunca tiene una
// dirección pública.

import { useState } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { Alert, Button } from './ui';

interface Props {
  slug: string;
  // Material del curso; sin él se descarga el ebook.
  resource?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function DownloadButton({ slug, resource, label = 'Descargar el ebook', variant = 'primary', className = '' }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const path = resource ? `/v1/courses/${slug}/resources/${resource}/download` : `/v1/courses/${slug}/download`;
      const { download } = await api<{ download: { url: string } }>(path);
      // El enlace pide al navegador guardar el archivo, así que la página no cambia.
      window.location.href = download.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos preparar la descarga. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={download} loading={busy} variant={variant} className={className}>
        <span className="material-symbols-outlined text-lg">download</span>
        {label}
      </Button>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
