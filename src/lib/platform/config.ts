// Configuración pública de la plataforma de cursos (variables PUBLIC_ del .env).

export const CULQI_PUBLIC_KEY = import.meta.env.PUBLIC_CULQI_PUBLIC_KEY as string | undefined;

// Por ahora todo se cobra con Culqi. La aprobación manual (Yape/Plin con captura que
// Karolay revisa) sigue en el código: PUBLIC_MANUAL_PAYMENTS=true la vuelve a mostrar.
export const MANUAL_PAYMENTS = import.meta.env.PUBLIC_MANUAL_PAYMENTS === 'true';

export const YAPE_NUMBER = import.meta.env.PUBLIC_YAPE_NUMBER as string | undefined;
export const YAPE_HOLDER = (import.meta.env.PUBLIC_YAPE_HOLDER as string | undefined) ?? 'Karolay Ramírez';
