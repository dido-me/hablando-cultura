// Lecturas públicas de la API que hace el servidor de Astro para renderizar el catálogo
// y la página de cada curso (buenas para Google). Se guardan un minuto en memoria: todas
// las visitas salen de la misma IP del servidor y comparten su límite de pedidos.

import type { Course, CoursePage } from './types';

const API_URL = (import.meta.env.API_URL ?? import.meta.env.PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const TTL_MS = 60_000;
const SLUG_RX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const cache = new Map<string, { at: number; data: unknown }>();

async function cached<T>(path: string): Promise<T | null> {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T;

  const res = await fetch(API_URL + path);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);

  const data = (await res.json()) as T;
  cache.set(path, { at: Date.now(), data });
  return data;
}

export async function getCatalog(): Promise<Course[]> {
  const data = await cached<{ courses: Course[] }>('/v1/courses');
  return data?.courses ?? [];
}

export async function getCourse(slug: string): Promise<CoursePage | null> {
  if (!SLUG_RX.test(slug)) return null;
  return cached<CoursePage>(`/v1/courses/${slug}`);
}
