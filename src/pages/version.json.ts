// Versión publicada del sitio, para confirmar qué release está en línea.
import type { APIRoute } from 'astro';
import { version } from '../../package.json';

export const prerender = true;

export const GET: APIRoute = () => new Response(JSON.stringify({ version }), { headers: { 'Content-Type': 'application/json' } });
