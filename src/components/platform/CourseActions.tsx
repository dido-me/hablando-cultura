// Tarjeta de compra de la página del curso. Según quién mira muestra: ingresar para
// comprar, activar la cuenta, comprar, pago en revisión o rechazado, o continuar el curso.

import { useEffect, useState } from 'react';
import { api, getToken, loadMe } from '../../lib/platform/api';
import { date, duration, soles } from '../../lib/platform/format';
import type { Course, CoursePage, Me, Payment, Viewer } from '../../lib/platform/types';
import Checkout from './Checkout';
import { Alert, Button, LinkButton, ProgressBar, Spinner } from './ui';

interface Props {
  course: Course;
  firstLessonSlug?: string;
}

export default function CourseActions({ course, firstLessonSlug }: Props) {
  const [me, setMe] = useState<Me | null>(null);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [resent, setResent] = useState(false);

  const coursePath = `/cursos/${course.slug}`;

  const refresh = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const [account, page] = await Promise.all([loadMe(true), api<CoursePage>(`/v1/courses/${course.slug}`)]);
      setMe(account);
      setViewer(page.viewer ?? null);
    } catch {
      // Sin sesión válida se muestra la tarjeta para visitantes.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const presale = course.presale_price_cents && course.presale_until && course.current_price_cents < course.price_cents;
  const startSlug = viewer?.next_lesson_slug ?? firstLessonSlug;

  const onPaid = (_: Payment) => {
    setPaid(true);
    setBuying(false);
    refresh();
  };

  const onSubmitted = (payment: Payment) => {
    setBuying(false);
    setViewer((current) => (current ? { ...current, latest_payment: payment } : current));
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-extrabold text-slate-900">{soles(course.current_price_cents)}</span>
        {presale && <span className="text-lg text-slate-400 line-through">{soles(course.price_cents)}</span>}
      </div>
      {presale && <p className="mt-1 text-sm font-semibold text-amber-700">Precio de preventa hasta el {date(course.presale_until!)}</p>}

      <ul className="mt-5 space-y-2 text-sm text-slate-600">
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[var(--primary)]">play_circle</span>
          {course.lesson_count} lecciones en video · {duration(course.total_duration_seconds)}
        </li>
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[var(--primary)]">all_inclusive</span>
          Acceso sin fecha de vencimiento
        </li>
        <li className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[var(--primary)]">subtitles</span>
          Subtítulos en español
        </li>
      </ul>

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-3">
            <Spinner className="h-5 w-5 text-[var(--primary)]" />
          </div>
        ) : !me ? (
          <>
            <LinkButton href={`/registro?next=${encodeURIComponent(coursePath)}`} className="w-full">
              Comprar el curso
            </LinkButton>
            <p className="text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <a href={`/ingresar?next=${encodeURIComponent(coursePath)}`} className="font-semibold text-[var(--primary)] hover:underline">
                Ingresa
              </a>
            </p>
          </>
        ) : viewer?.enrolled ? (
          <>
            {paid && <Alert tone="success">¡Pago confirmado! Ya tienes acceso. Te enviamos el comprobante por correo.</Alert>}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Tu avance</span>
                <span>
                  {viewer.completed_lessons} de {course.lesson_count}
                </span>
              </div>
              <ProgressBar value={viewer.completed_lessons} total={course.lesson_count} />
            </div>
            {startSlug && (
              <LinkButton href={`${coursePath}/${startSlug}`} className="w-full">
                {viewer.course_completed ? 'Repasar el curso' : viewer.completed_lessons > 0 ? 'Continuar' : 'Empezar el curso'}
              </LinkButton>
            )}
          </>
        ) : !me.user.activated ? (
          <>
            <Alert tone="warning">Activa tu cuenta para comprar: abre el enlace que enviamos a {me.user.email}.</Alert>
            {resent ? (
              <p className="text-center text-sm text-emerald-700">Te enviamos un nuevo enlace.</p>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => api('/v1/tokens/activation', { method: 'POST', body: { email: me.user.email } }).then(() => setResent(true))}
              >
                Reenviar el correo de activación
              </Button>
            )}
          </>
        ) : viewer?.latest_payment?.status === 'pending' ? (
          <Alert tone="info">
            <strong>Tu pago está en revisión.</strong> Karolay lo confirmará pronto y te avisaremos por correo.
          </Alert>
        ) : buying ? (
          <>
            <Checkout courseSlug={course.slug} courseTitle={course.title} priceCents={course.current_price_cents} email={me.user.email} onPaid={onPaid} onSubmitted={onSubmitted} />
            <Button variant="ghost" className="w-full" onClick={() => setBuying(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            {viewer?.latest_payment?.status === 'rejected' && (
              <Alert tone="error">
                Tu pago anterior fue rechazado{viewer.latest_payment.reject_reason ? `: ${viewer.latest_payment.reject_reason}` : '.'} Puedes intentarlo de nuevo.
              </Alert>
            )}
            <Button className="w-full" onClick={() => setBuying(true)}>
              Comprar el curso
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
