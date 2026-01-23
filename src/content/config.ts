import { defineCollection, z } from 'astro:content';
import { BLOG_CATEGORIES_LIST } from '../lib/constants';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    heroImage: z.string().optional(),
    // Categoría validada contra las constantes definidas
    category: z.enum(BLOG_CATEGORIES_LIST as unknown as [string, ...string[]]).default('Gestión Cultural'),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Karolay Ramírez'),
    featured: z.boolean().default(false),
    // Campos adicionales para mejor SEO y contenido
    readingTime: z.number().optional(), // Tiempo de lectura en minutos
    references: z.array(z.object({
      title: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
