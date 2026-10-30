// Texto de refuerzo de una lección (Markdown) y su índice "En esta lección", al estilo de
// las lecciones de Claude Academy. react-markdown no interpreta HTML incrustado, así que el
// contenido no puede inyectar scripts.

import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';

export interface Section {
  id: string;
  title: string;
}

// slug da a cada sección un id estable para los enlaces del índice.
function slug(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function textOf(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : ''))
    .join('');
}

// outline lista las secciones (## ) del texto para el índice.
export function outline(markdown: string): Section[] {
  return markdown
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => {
      const title = line.slice(3).replace(/[*_`]/g, '').trim();
      return { id: slug(title), title };
    });
}

export function LessonArticle({ content }: { content: string }) {
  return (
    <article className="prose prose-slate max-w-none prose-headings:font-display prose-headings:text-slate-900 prose-h2:mt-12 prose-h2:text-2xl prose-h3:text-lg prose-a:text-[var(--primary)] prose-strong:text-slate-900 prose-li:my-1">
      <Markdown
        components={{
          h2: ({ children }) => (
            <h2 id={slug(textOf(children))} className="scroll-mt-28">
              {children}
            </h2>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </article>
  );
}

// LessonOutline marca la sección que se está leyendo, como el índice lateral de Academy.
export function LessonOutline({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const headings = sections.map((s) => document.getElementById(s.id)).filter((h): h is HTMLElement => h !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-100px 0px -65% 0px' },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav aria-label="En esta lección" className="rounded-3xl bg-white p-6 ring-1 ring-slate-100">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">En esta lección</h2>
      <ol className="mt-3 space-y-1 border-l border-slate-100">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? 'location' : undefined}
              className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm transition ${active === section.id ? 'border-[var(--primary)] font-semibold text-[var(--primary)]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
