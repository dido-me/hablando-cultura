/**
 * Constantes globales del sitio
 * Este archivo centraliza todas las constantes para facilitar el mantenimiento
 */

// ============================================
// CATEGORÍAS DEL BLOG
// ============================================

export const BLOG_CATEGORIES = {
  GESTION_CULTURAL: 'Gestión Cultural',
  TRANSFORMACION_DIGITAL: 'Transformación Digital',
  INNOVACION: 'Innovación',
  EMPRENDIMIENTO: 'Emprendimiento',
  MARKETING_CULTURAL: 'Marketing Cultural',
  PATRIMONIO: 'Patrimonio',
  EVENTOS: 'Eventos',
} as const;

// Tipo derivado de las categorías
export type BlogCategory = typeof BLOG_CATEGORIES[keyof typeof BLOG_CATEGORIES];

// Array de categorías para iteración
export const BLOG_CATEGORIES_LIST: BlogCategory[] = Object.values(BLOG_CATEGORIES);

// Colores asociados a cada categoría (para badges, tags, etc.)
export const CATEGORY_COLORS: Record<BlogCategory, { bg: string; text: string }> = {
  [BLOG_CATEGORIES.GESTION_CULTURAL]: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-700' 
  },
  [BLOG_CATEGORIES.TRANSFORMACION_DIGITAL]: { 
    bg: 'bg-blue-100', 
    text: 'text-blue-700' 
  },
  [BLOG_CATEGORIES.INNOVACION]: { 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700' 
  },
  [BLOG_CATEGORIES.EMPRENDIMIENTO]: { 
    bg: 'bg-amber-100', 
    text: 'text-amber-700' 
  },
  [BLOG_CATEGORIES.MARKETING_CULTURAL]: { 
    bg: 'bg-rose-100', 
    text: 'text-rose-700' 
  },
  [BLOG_CATEGORIES.PATRIMONIO]: { 
    bg: 'bg-teal-100', 
    text: 'text-teal-700' 
  },
  [BLOG_CATEGORIES.EVENTOS]: { 
    bg: 'bg-indigo-100', 
    text: 'text-indigo-700' 
  },
};

// Iconos asociados a cada categoría (Material Symbols)
export const CATEGORY_ICONS: Record<BlogCategory, string> = {
  [BLOG_CATEGORIES.GESTION_CULTURAL]: 'theater_comedy',
  [BLOG_CATEGORIES.TRANSFORMACION_DIGITAL]: 'devices',
  [BLOG_CATEGORIES.INNOVACION]: 'lightbulb',
  [BLOG_CATEGORIES.EMPRENDIMIENTO]: 'rocket_launch',
  [BLOG_CATEGORIES.MARKETING_CULTURAL]: 'campaign',
  [BLOG_CATEGORIES.PATRIMONIO]: 'museum',
  [BLOG_CATEGORIES.EVENTOS]: 'celebration',
};

// Slugs para URLs amigables
export const CATEGORY_SLUGS: Record<BlogCategory, string> = {
  [BLOG_CATEGORIES.GESTION_CULTURAL]: 'gestion-cultural',
  [BLOG_CATEGORIES.TRANSFORMACION_DIGITAL]: 'transformacion-digital',
  [BLOG_CATEGORIES.INNOVACION]: 'innovacion',
  [BLOG_CATEGORIES.EMPRENDIMIENTO]: 'emprendimiento',
  [BLOG_CATEGORIES.MARKETING_CULTURAL]: 'marketing-cultural',
  [BLOG_CATEGORIES.PATRIMONIO]: 'patrimonio',
  [BLOG_CATEGORIES.EVENTOS]: 'eventos',
};

// Función para obtener categoría desde slug
export function getCategoryFromSlug(slug: string): BlogCategory | undefined {
  const entry = Object.entries(CATEGORY_SLUGS).find(([_, s]) => s === slug);
  return entry ? entry[0] as BlogCategory : undefined;
}

// Función para obtener slug desde categoría
export function getSlugFromCategory(category: BlogCategory): string {
  return CATEGORY_SLUGS[category] || category.toLowerCase().replace(/\s+/g, '-');
}

// ============================================
// INFORMACIÓN DEL SITIO
// ============================================

export const SITE_INFO = {
  name: 'Karolay Ramírez',
  title: 'Gestión Cultural',
  description: 'Actualidad, tendencias y consejos sobre gestión cultural, emprendimiento y transformación digital en el sector creativo.',
  author: 'Karolay Ramírez',
  email: 'contacto@karolayramirez.com',
  social: {
    instagram: 'https://instagram.com/karolayramirez',
    linkedin: 'https://linkedin.com/in/karolayramirez',
    youtube: 'https://youtube.com/@karolayramirez',
  },
} as const;

// ============================================
// TAGS POPULARES
// ============================================

export const POPULAR_TAGS = [
  'gestión cultural',
  'festivales',
  'financiamiento',
  'digitalización',
  'museos',
  'inteligencia artificial',
  'emprendimiento cultural',
  'marketing',
  'patrimonio',
  'eventos',
] as const;
