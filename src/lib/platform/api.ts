// Cliente de la API de cursos (Go). El navegador la llama directamente (CORS) con el
// token de sesión, así cada alumno cuenta con su propia IP en el límite de pedidos.

import type { AuthToken, Me } from './types';

export const API_URL = (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const SESSION_KEY = 'hc_session';
const SESSION_EVENT = 'hc:session';

// El token se guarda con su vencimiento para no usarlo cuando ya expiró.
export function getToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AuthToken;
    if (new Date(session.expiry).getTime() <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session.token;
  } catch {
    return null;
  }
}

export function saveSession(token: AuthToken) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(token));
  mePromise = null;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sin localStorage no hay sesión que borrar.
  }
  mePromise = null;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// notifyAccountChange avisa a las demás islas de la página que la cuenta cambió, por
// ejemplo después de comprar un curso.
export function notifyAccountChange() {
  mePromise = null;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function onSessionChange(listener: () => void) {
  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(status: number, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

// Los mensajes de la API vienen en inglés; los que ve el alumno se traducen aquí. Los
// rechazos de Culqi ya vienen en español y pasan tal cual.
const messages: Record<string, string> = {
  'invalid authentication credentials': 'Correo o contraseña incorrectos.',
  'invalid or missing authentication token': 'Tu sesión expiró. Vuelve a ingresar.',
  'you must be authenticated to access this resource': 'Ingresa a tu cuenta para continuar.',
  'your user account must be activated to access this resource': 'Activa tu cuenta con el enlace que te enviamos por correo para continuar.',
  "your user account doesn't have the necessary permissions to access this resource": 'No tienes permiso para ver esta sección.',
  'you must be enrolled in this course to access this lesson': 'Esta lección es parte del curso. Cómpralo para verla.',
  'rate limit exceeded': 'Demasiados intentos seguidos. Espera unos segundos e intenta de nuevo.',
  'you are already enrolled in this course': 'Ya tienes acceso a este curso.',
  'you already have a payment under review for this course': 'Ya tienes un pago en revisión para este curso.',
  'a payment for this course is already in progress': 'Ya hay un pago en proceso. Espera unos segundos.',
  'card payments are not configured': 'El pago con tarjeta no está disponible en este momento. Usa Yape o Plin directo.',
  'receipt uploads are not configured': 'La subida de comprobantes no está disponible en este momento.',
  'video playback is not configured': 'El video no está disponible en este momento.',
  'downloads are not configured': 'La descarga no está disponible en este momento. Escríbenos y te ayudamos.',
  'the requested resource could not be found': 'No encontramos lo que buscas.',
  'unable to update the record due to an edit conflict, please try again': 'Alguien más cambió este registro. Recarga e intenta de nuevo.',
  'the server encountered a problem and could not process your request': 'Ocurrió un problema en el servidor. Intenta de nuevo en unos minutos.',
  'a user with this email address already exists': 'Ya existe una cuenta con este correo. Ingresa con él.',
  'must be a valid email address': 'Escribe un correo válido.',
  'must be provided': 'Este campo es obligatorio.',
  'must be at least 8 bytes long': 'Debe tener al menos 8 caracteres.',
  'must not be more than 72 bytes long': 'Debe tener como máximo 72 caracteres.',
  'no matching email address found': 'No hay una cuenta con este correo.',
  'user account must be activated': 'Primero activa tu cuenta con el enlace que te enviamos.',
  'user has already been activated': 'Tu cuenta ya está activada.',
  'invalid or expired activation token': 'El enlace de activación no es válido o ya venció. Pide uno nuevo.',
  'invalid or expired password reset token': 'El enlace para cambiar la contraseña no es válido o ya venció. Pide uno nuevo.',
  'must be 26 bytes long': 'El enlace no es válido. Revisa que lo copiaste completo.',
  'has already been used for another payment': 'Ese número de operación ya fue usado en otro pago.',
  'must be 4 to 40 letters, digits or hyphens': 'Escribe el número de operación tal como aparece en tu comprobante.',
  'must be a JPG, PNG or WebP image, or a PDF': 'Sube una imagen (JPG, PNG o WebP) o un PDF.',
  'must not be more than 5 MB': 'El archivo debe pesar como máximo 5 MB.',
  "the receipt hasn't been uploaded yet": 'La captura no terminó de subirse. Intenta de nuevo.',
  'must be a JPG, PNG or WebP image, or a PDF, of at most 5 MB': 'Sube una imagen o un PDF de máximo 5 MB.',
  // Cupones, al comprar.
  "this coupon doesn't exist": 'Ese cupón no existe. Revisa que esté bien escrito.',
  'this coupon is no longer available': 'Este cupón ya no está disponible.',
  "this coupon isn't valid yet": 'Este cupón todavía no está vigente.',
  'this coupon has expired': 'Este cupón ya venció.',
  "this coupon doesn't apply to this product": 'Este cupón no aplica a este producto.',
  'this coupon has no uses left': 'Este cupón ya se agotó.',
  'the price with this coupon is below the minimum payment of S/ 3.00': 'Con este cupón el total queda por debajo del pago mínimo de S/ 3.00.',
  'this coupon makes the product free; redeem it instead of paying': 'Con este cupón el producto es gratis. Recarga la página y vuelve a aplicarlo.',
  "this coupon doesn't make the product free": 'Este cupón no cubre todo el precio.',
  'the price changed, review it before paying': 'El precio cambió. Vuelve a aplicar tu cupón o recarga la página antes de pagar.',
  // Cupones, en el panel.
  'a coupon with this code already exists': 'Ya existe un cupón con este código.',
  'must be 3 to 30 characters long': 'Debe tener entre 3 y 30 caracteres.',
  'must contain only letters, digits and hyphens': 'Usa solo letras, números y guiones.',
  'must be percent or amount': 'Elige porcentaje o monto fijo.',
  'must be greater than zero': 'Debe ser mayor que cero.',
  'must not be more than 100': 'No puede ser más de 100 %.',
  'must not be more than S/ 100,000': 'No puede ser más de S/ 100,000.',
  'must include at least one product': 'Elige al menos un producto.',
  'must not contain duplicate values': 'Hay productos repetidos.',
  'must be existing products': 'Elige productos que existan.',
  'must be after the start date': 'Debe ser posterior a la fecha de inicio.',
  'must not be more than 500 bytes long': 'Debe tener como máximo 500 caracteres.',
  'this coupon has been used; deactivate it instead': 'Este cupón ya se usó: desactívalo en lugar de borrarlo.',
};

const translate = (text: string) => messages[text] ?? text;

interface RequestOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Un token vencido o revocado deja de servir: la sesión se cierra en este navegador.
    if (res.status === 401 && token) clearSession();

    const error = data?.error;
    if (error && typeof error === 'object') {
      const fields = Object.fromEntries(Object.entries(error).map(([field, text]) => [field, translate(String(text))]));
      throw new ApiError(res.status, Object.values(fields)[0] ?? 'Revisa los datos e intenta de nuevo.', fields);
    }
    throw new ApiError(res.status, translate(typeof error === 'string' ? error : 'Ocurrió un error. Intenta de nuevo.'));
  }

  return data as T;
}

// La cuenta del usuario se pide una sola vez por página, aunque varias islas la usen.
let mePromise: Promise<Me | null> | null = null;

export function loadMe(force = false): Promise<Me | null> {
  if (!getToken()) return Promise.resolve(null);
  if (!mePromise || force) {
    mePromise = api<Me>('/v1/me').catch((err) => {
      mePromise = null;
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    });
  }
  return mePromise;
}

// safeNext evita redirigir fuera del sitio con ?next=https://otro-sitio.
export function safeNext(next: string | null, fallback = '/mi-cuenta') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
