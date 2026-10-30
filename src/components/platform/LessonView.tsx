// Vista de una lección: video de Mux con URL firmada, texto de refuerzo con su índice,
// temario con avance, y guardado del progreso para retomar donde quedó. Al pasar el 90 %
// del video la lección cuenta como vista.

import MuxPlayer from '@mux/mux-player-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError } from '../../lib/platform/api';
import { duration } from '../../lib/platform/format';
import type { CoursePage, LessonPage, LessonProgress } from '../../lib/platform/types';
import { ResourceList } from './CourseResources';
import { LessonArticle, LessonOutline, outline } from './LessonContent';
import { Alert, LinkButton, Loading, ProgressBar } from './ui';

const SAVE_EVERY_SECONDS = 15;
const COMPLETED_AT = 0.9;

interface Props {
  courseSlug: string;
  lessonSlug: string;
}

type Failure = { status: number; message: string };

export default function LessonView({ courseSlug, lessonSlug }: Props) {
  const [page, setPage] = useState<LessonPage | null>(null);
  const [course, setCourse] = useState<CoursePage | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const lastSaved = useRef(0);
  const done = useRef(false);
  const sections = useMemo(() => outline(page?.lesson.content ?? ''), [page]);

  useEffect(() => {
    Promise.all([api<LessonPage>(`/v1/courses/${courseSlug}/lessons/${lessonSlug}`), api<CoursePage>(`/v1/courses/${courseSlug}`)])
      .then(([lessonPage, coursePage]) => {
        setPage(lessonPage);
        setCourse(coursePage);
        done.current = lessonPage.progress?.completed ?? false;
        lastSaved.current = lessonPage.progress?.position_seconds ?? 0;
        setCompleted(new Set((coursePage.viewer?.progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id)));
      })
      .catch((err) => setFailure(err instanceof ApiError ? { status: err.status, message: err.message } : { status: 0, message: 'No pudimos cargar la lección.' }));
  }, [courseSlug, lessonSlug]);

  if (failure) return <LessonFailure failure={failure} courseSlug={courseSlug} />;
  if (!page || !course) return <Loading label="Cargando la lección…" />;

  const lesson = page.lesson;
  const coursePath = `/cursos/${courseSlug}`;

  const save = (seconds: number, isCompleted: boolean) => {
    // La API no acepta una posición más allá de la duración guardada de la lección.
    const limit = lesson.duration_seconds > 0 ? lesson.duration_seconds : Number.MAX_SAFE_INTEGER;
    api<{ progress: LessonProgress }>(`/v1/courses/${courseSlug}/lessons/${lessonSlug}/progress`, {
      method: 'PUT',
      body: { position_seconds: Math.max(0, Math.min(Math.floor(seconds), limit)), completed: isCompleted },
    }).catch(() => {
      // Si falla, el siguiente guardado lo corrige; no se interrumpe el video.
    });
  };

  const markCompleted = () => {
    done.current = true;
    setCompleted((current) => new Set(current).add(lesson.id));
  };

  const onTimeUpdate = (event: Event) => {
    const media = event.target as unknown as { currentTime: number; duration: number };
    const seconds = media.currentTime;
    if (!done.current && media.duration > 0 && seconds / media.duration >= COMPLETED_AT) {
      markCompleted();
      lastSaved.current = seconds;
      save(seconds, true);
    } else if (Math.abs(seconds - lastSaved.current) >= SAVE_EVERY_SECONDS) {
      lastSaved.current = seconds;
      save(seconds, done.current);
    }
  };

  const onPause = (event: Event) => {
    const media = event.target as unknown as { currentTime: number };
    lastSaved.current = media.currentTime;
    save(media.currentTime, done.current);
  };

  const onEnded = () => {
    markCompleted();
    save(lesson.duration_seconds, true);
  };

  const completedCount = course.lessons.filter((l) => completed.has(l.id)).length;
  const resumeAt = page.progress && !page.progress.completed ? page.progress.position_seconds : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-3xl bg-slate-900 shadow-lg">
          {page.playback ? (
            <MuxPlayer
              playbackId={page.playback.playback_id}
              tokens={{ playback: page.playback.video, thumbnail: page.playback.thumbnail, storyboard: page.playback.storyboard }}
              metadata={{ video_title: `${course.course.title} · ${lesson.title}` }}
              streamType="on-demand"
              accentColor="#6d28d9"
              startTime={resumeAt}
              onTimeUpdate={onTimeUpdate}
              onPause={onPause}
              onEnded={onEnded}
              style={{ aspectRatio: '16 / 9', width: '100%' }}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-slate-300">El video de esta lección estará disponible pronto.</div>
          )}
        </div>

        <div>
          {lesson.module_title && <p className="text-sm font-semibold text-[var(--primary)]">{lesson.module_title}</p>}
          <h1 className="mt-1 font-display text-3xl font-bold text-slate-900 md:text-4xl">{lesson.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ring-slate-200">
              <span className="material-symbols-outlined text-base">menu_book</span>
              Lección {page.position} de {page.total}
            </span>
            {lesson.duration_seconds > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 ring-1 ring-slate-200">
                <span className="material-symbols-outlined text-base">schedule</span>
                {duration(lesson.duration_seconds)}
              </span>
            )}
            {resumeAt > 0 && <span className="text-slate-500">Retomas donde te quedaste.</span>}
          </div>
          {lesson.summary && !lesson.content && <p className="mt-4 whitespace-pre-line text-slate-600">{lesson.summary}</p>}
        </div>

        {lesson.content && (
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 sm:p-10">
            <LessonArticle content={lesson.content} />
          </div>
        )}

        {lesson.resource_urls && lesson.resource_urls.length > 0 && (
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100">
            <h2 className="font-display text-lg font-bold text-slate-900">Materiales</h2>
            <ul className="mt-3 space-y-2">
              {lesson.resource_urls.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline">
                    <span className="material-symbols-outlined text-lg">download</span>
                    {decodeURIComponent(url.split('/').pop() ?? url)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label="Lecciones">
          {page.previous_lesson_slug ? (
            <LinkButton href={`${coursePath}/${page.previous_lesson_slug}`} variant="secondary">
              <span className="material-symbols-outlined text-lg">arrow_back</span> Anterior
            </LinkButton>
          ) : (
            <span />
          )}
          {page.next_lesson_slug ? (
            <LinkButton href={`${coursePath}/${page.next_lesson_slug}`}>
              Siguiente lección <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </LinkButton>
          ) : (
            <LinkButton href="/mi-cuenta" variant="secondary">
              Terminaste el curso · Ir a Mi cuenta
            </LinkButton>
          )}
        </nav>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
        {/* El índice va primero, como en Academy; en el celular el texto ya se lee de corrido. */}
        <div className="hidden lg:block">
          <LessonOutline sections={sections} />
        </div>
        {course.viewer?.enrolled && course.resources && course.resources.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-slate-900">Materiales del curso</h2>
            <ResourceList courseSlug={courseSlug} resources={course.resources} enrolled />
          </div>
        )}
        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100">
          <a href={coursePath} className="text-sm font-semibold text-slate-500 hover:text-[var(--primary)]">
            ← {course.course.title}
          </a>
          <h2 className="mt-3 font-display text-lg font-bold text-slate-900">Contenido del curso</h2>
          <div className="mt-3 space-y-1.5">
            <ProgressBar value={completedCount} total={course.lessons.length} />
            <p className="text-xs text-slate-500">
              {completedCount} de {course.lessons.length} lecciones vistas
            </p>
          </div>
          <ol className="mt-4 space-y-1">
            {course.lessons.map((item) => {
              const current = item.slug === lesson.slug;
              const seen = completed.has(item.id);
              return (
                <li key={item.id}>
                  <a
                    href={`${coursePath}/${item.slug}`}
                    aria-current={current ? 'page' : undefined}
                    className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition ${current ? 'bg-violet-50 font-semibold text-[var(--primary)]' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className={`material-symbols-outlined mt-0.5 text-lg ${seen ? 'text-emerald-600' : current ? 'text-[var(--primary)]' : 'text-slate-300'}`}>
                      {seen ? 'check_circle' : current ? 'play_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className="flex-1">{item.title}</span>
                    <span className="mt-0.5 text-xs text-slate-400">{duration(item.duration_seconds)}</span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function LessonFailure({ failure, courseSlug }: { failure: Failure; courseSlug: string }) {
  const here = encodeURIComponent(window.location.pathname);
  return (
    <div className="mx-auto max-w-lg space-y-5 py-12 text-center">
      <Alert tone={failure.status === 403 ? 'warning' : 'error'}>{failure.message}</Alert>
      {failure.status === 401 ? (
        <LinkButton href={`/ingresar?next=${here}`}>Ingresar</LinkButton>
      ) : failure.message.includes('Activa') ? (
        <LinkButton href="/mi-cuenta">Ir a Mi cuenta</LinkButton>
      ) : (
        <LinkButton href={`/cursos/${courseSlug}`}>Ver el curso</LinkButton>
      )}
    </div>
  );
}
