// Descarga de un ebook comprado: pide a la API un enlace de cinco minutos al PDF privado
// y lo abre. El archivo nunca tiene una dirección pública.

import { useState } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { Alert, Button } from './ui';

export default function DownloadButton({ slug, className = '' }: { slug: string; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const download = async () => {
    setBusy(true);
    setError('');
    try {
      const { download } = await api<{ download: { url: string } }>(`/v1/courses/${slug}/download`);
      window.location.href = download.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos preparar la descarga. Intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={download} loading={busy} className={className}>
        <span className="material-symbols-outlined text-lg">download</span>
        Descargar el ebook
      </Button>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
