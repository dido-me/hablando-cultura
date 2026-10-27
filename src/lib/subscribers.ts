// Registra a quienes se suscriben al newsletter o piden el ebook en la API de cursos, que
// los guarda sin duplicados y los muestra en /admin/suscriptores. Antes iban a una hoja
// de Google Sheets. La llamada es de servidor a servidor.

const API_URL = (import.meta.env.API_URL || import.meta.env.PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// InvalidSubscriber es un dato que la API rechaza (por ejemplo, un correo inválido).
export class InvalidSubscriber extends Error {}

interface Subscriber {
  email: string;
  name?: string;
  wantsWhatsApp?: boolean;
  source: 'newsletter-blog' | 'ebook-landing';
}

export async function recordSubscriber({ email, name = '', wantsWhatsApp = false, source }: Subscriber): Promise<void> {
  const res = await fetch(`${API_URL}/v1/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, wants_whatsapp: wantsWhatsApp, source }),
  });

  if (res.status === 422) {
    const data = await res.json().catch(() => ({}));
    throw new InvalidSubscriber(JSON.stringify(data.error ?? {}));
  }
  if (!res.ok) {
    throw new Error(`subscribers API returned ${res.status}`);
  }
}
