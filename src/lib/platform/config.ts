// Configuración pública de la plataforma de cursos (variables PUBLIC_ del .env).

export const CULQI_PUBLIC_KEY = import.meta.env.PUBLIC_CULQI_PUBLIC_KEY as string | undefined;

// Por ahora todo se cobra con Culqi. La aprobación manual (Yape/Plin con captura que
// Karolay revisa) sigue en el código: PUBLIC_MANUAL_PAYMENTS=true la vuelve a mostrar.
export const MANUAL_PAYMENTS = import.meta.env.PUBLIC_MANUAL_PAYMENTS === 'true';

// Mientras el sitio es una demo (Culqi en modo prueba) nadie crea cuentas:
// PUBLIC_SIGNUP_OPEN=false oculta el registro, y la API (SIGNUPS=closed) lo rechaza.
export const SIGNUP_OPEN = import.meta.env.PUBLIC_SIGNUP_OPEN !== 'false';

export const YAPE_NUMBER = import.meta.env.PUBLIC_YAPE_NUMBER as string | undefined;
export const YAPE_HOLDER = (import.meta.env.PUBLIC_YAPE_HOLDER as string | undefined) ?? 'Karolay Ramírez';

// Datos del comercio que Culqi e INDECOPI piden mostrar: contacto visible y, en el Libro
// de Reclamaciones, el titular del RUC con su domicilio fiscal.
export const BUSINESS = {
  tradeName: 'Hablando Cultura',
  name: (import.meta.env.PUBLIC_BUSINESS_NAME as string | undefined) || 'Cynthia Karolay Ramírez Andrade',
  ruc: (import.meta.env.PUBLIC_BUSINESS_RUC as string | undefined) || '10461263742',
  address: (import.meta.env.PUBLIC_BUSINESS_ADDRESS as string | undefined) || '',
  phone: (import.meta.env.PUBLIC_CONTACT_PHONE as string | undefined) || '',
  email: (import.meta.env.PUBLIC_CONTACT_EMAIL as string | undefined) || 'hablandocultura@gmail.com',
};
