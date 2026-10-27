// "Mi cuenta": datos del alumno, aviso de activación, sus cursos con avance y sus pagos.

import { useEffect, useState } from 'react';
import { api, clearSession, getToken, loadMe } from '../../lib/platform/api';
import { date, methodLabels, soles, statusLabels } from '../../lib/platform/format';
import type { Me } from '../../lib/platform/types';
import DownloadButton from './DownloadButton';
import { Alert, Badge, Button, Card, LinkButton, Loading, ProgressBar } from './ui';

const statusTone = { pending: 'warning', approved: 'success', rejected: 'error' } as const;

export default function MyAccount() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      window.location.replace(`/ingresar?next=${encodeURIComponent('/mi-cuenta')}`);
      return;
    }
    loadMe(true)
      .then((account) => {
        if (!account) window.location.replace(`/ingresar?next=${encodeURIComponent('/mi-cuenta')}`);
        else setMe(account);
      })
      .catch(() => setError('No pudimos cargar tu cuenta. Recarga la página.'));
  }, []);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!me) return <Loading />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-slate-900">Hola, {me.user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-slate-500">{me.user.email}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            clearSession();
            window.location.href = '/';
          }}
        >
          Cerrar sesión
        </Button>
      </div>

      {!me.user.activated && (
        <Alert tone="warning">
          <p>
            <strong>Activa tu cuenta</strong> con el enlace que enviamos a {me.user.email} para poder comprar y ver cursos.
          </p>
          {resent ? (
            <p className="mt-2 font-semibold">Te enviamos un nuevo enlace. Revisa también la carpeta de spam.</p>
          ) : (
            <button
              type="button"
              className="mt-2 font-semibold underline"
              onClick={() => api('/v1/tokens/activation', { method: 'POST', body: { email: me.user.email } }).then(() => setResent(true))}
            >
              Reenviar el correo de activación
            </button>
          )}
        </Alert>
      )}

      <section>
        <h2 className="font-display text-2xl font-bold text-slate-900">Mis cursos y ebooks</h2>
        {me.courses.length === 0 ? (
          <Card className="mt-4 text-center">
            <p className="text-slate-600">Aún no tienes cursos ni ebooks.</p>
            <LinkButton href="/cursos" className="mt-4">
              Ver cursos
            </LinkButton>
          </Card>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {me.courses.map((course) => (
              <div key={course.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100">
                {course.cover_url && <img src={course.cover_url} alt="" className="aspect-video w-full object-cover" />}
                <div className="space-y-4 p-6">
                  <h3 className="font-display text-xl font-bold text-slate-900">{course.title}</h3>
                  {course.kind === 'ebook' ? (
                    <DownloadButton slug={course.slug} className="w-full" />
                  ) : (
                    <>
                  <div className="space-y-1.5">
                    <ProgressBar value={course.completed_lessons} total={course.lesson_count} />
                    <p className="text-xs text-slate-500">
                      {course.completed_lessons} de {course.lesson_count} lecciones vistas
                    </p>
                  </div>
                  <LinkButton href={`/cursos/${course.slug}/${course.next_lesson_slug ?? ''}`} className="w-full">
                    {course.course_completed ? 'Repasar' : course.completed_lessons > 0 ? 'Continuar' : 'Empezar'}
                  </LinkButton>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {me.payments.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold text-slate-900">Mis pagos</h2>
          <Card className="mt-4 overflow-x-auto p-0 sm:p-0">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Producto</th>
                  <th className="px-6 py-4 font-semibold">Medio</th>
                  <th className="px-6 py-4 font-semibold">Monto</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {me.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 text-slate-500">{date(payment.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{payment.course_title}</td>
                    <td className="px-6 py-4 text-slate-600">{methodLabels[payment.method]}</td>
                    <td className="px-6 py-4 text-slate-800">{soles(payment.amount_cents)}</td>
                    <td className="px-6 py-4">
                      <Badge tone={statusTone[payment.status]}>{statusLabels[payment.status]}</Badge>
                      {payment.reject_reason && <p className="mt-1 text-xs text-red-600">{payment.reject_reason}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </div>
  );
}
