// Productos que la home promociona. La home se genera al compilar, así que la API se lee
// una sola vez por despliegue; si no responde, la home sale igual con el texto de respaldo
// y sin precio.

import { getCatalog, getCourse } from './server';
import type { Course, Lesson } from './types';

export const FEATURED_COURSE_SLUG = 'haz-realidad-tu-proyecto-cultural';

const TIMEOUT_MS = 8_000;

export interface FeaturedCourse {
  course: Course;
  lessons: Lesson[];
  // Falso cuando la API no respondió: el precio y el temario no se muestran.
  live: boolean;
}

const fallbackCourse: Course = {
  id: 0,
  slug: FEATURED_COURSE_SLUG,
  kind: 'course',
  title: 'Haz realidad tu proyecto cultural',
  subtitle: 'Convierte tu idea cultural en un proyecto real.',
  description:
    'Curso en video para quienes desean emprender en el arte y la cultura. Recorre paso a paso las cuatro etapas para formular un proyecto cultural (análisis contextual, diagnóstico, producción y evaluación) y prepáralo para presentarlo a fondos públicos, convocatorias internacionales o patrocinadores.',
  cover_url: '/portadas/haz-realidad-tu-proyecto-cultural.jpg',
  prerequisites: 'No necesitas experiencia previa en gestión cultural, solo el deseo de crear y aprender.',
  price_cents: 0,
  current_price_cents: 0,
  lesson_count: 0,
  total_duration_seconds: 0,
};

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('API timeout')), TIMEOUT_MS)),
  ]);
}

export async function getFeaturedCourse(): Promise<FeaturedCourse> {
  try {
    const page = await withTimeout(getCourse(FEATURED_COURSE_SLUG));
    if (page) return { course: page.course, lessons: page.lessons, live: true };
  } catch {
    // Se usa el texto de respaldo.
  }
  return { course: fallbackCourse, lessons: [], live: false };
}

export async function getFeaturedEbook(): Promise<Course | null> {
  try {
    const catalog = await withTimeout(getCatalog());
    return catalog.find((product) => product.kind === 'ebook') ?? null;
  } catch {
    return null;
  }
}

const dayMonth = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'America/Lima' });

// presale describe la preventa de un producto al compilar. La página lleva los dos precios
// y PresaleSwitch.astro deja el normal cuando la preventa ya terminó, sin esperar a otro
// despliegue.
export function presale(course: Course) {
  const until = course.presale_until;
  return {
    active: course.current_price_cents < course.price_cents,
    until,
    // "30 de noviembre"
    untilLabel: until ? dayMonth.format(new Date(until)) : undefined,
  };
}
