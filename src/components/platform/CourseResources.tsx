// Materiales del curso (el cuaderno de trabajo…). En la página del curso la lista es
// pública y cada archivo se descarga solo si el alumno compró el curso.

import { useEffect, useState } from 'react';
import { getToken, loadMe, onSessionChange } from '../../lib/platform/api';
import { fileFormat } from '../../lib/platform/format';
import type { CourseResource } from '../../lib/platform/types';
import DownloadButton from './DownloadButton';

interface Props {
  courseSlug: string;
  resources: CourseResource[];
}

export default function CourseResources({ courseSlug, resources }: Props) {
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!getToken()) {
        setEnrolled(false);
        return;
      }
      loadMe()
        .then((me) => setEnrolled(Boolean(me?.courses.some((course) => course.slug === courseSlug))))
        .catch(() => setEnrolled(false));
    };
    check();
    // Al comprar en la misma página, la tarjeta de compra avisa y aparecen las descargas.
    return onSessionChange(check);
  }, [courseSlug]);

  return <ResourceList courseSlug={courseSlug} resources={resources} enrolled={enrolled} />;
}

export function ResourceList({ courseSlug, resources, enrolled }: Props & { enrolled: boolean }) {
  return (
    <ul className="space-y-3">
      {resources.map((resource) => {
        const format = fileFormat(resource.format);
        return (
          <li key={resource.slug} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-[var(--primary)]">
              <span className="material-symbols-outlined">{format.icon}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">{resource.title}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{format.label}</p>
              {resource.description && <p className="mt-1 text-sm text-slate-500">{resource.description}</p>}
              <div className="mt-3">
                {enrolled ? (
                  <DownloadButton slug={courseSlug} resource={resource.slug} label="Descargar" variant="secondary" />
                ) : (
                  <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                    <span className="material-symbols-outlined text-base">lock</span>
                    Incluido al comprar el curso
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
