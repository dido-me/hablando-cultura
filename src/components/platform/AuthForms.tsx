// Formularios de cuenta: ingresar, crear cuenta, olvidé mi contraseña, cambiarla con el
// enlace del correo y activar la cuenta.

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError, safeNext, saveSession } from '../../lib/platform/api';
import type { AuthToken } from '../../lib/platform/types';
import GoogleButton from './GoogleButton';
import { Alert, Button, Card, Field, LinkButton, Loading } from './ui';

const nextParam = () => new URLSearchParams(window.location.search).get('next');
const tokenParam = () => new URLSearchParams(window.location.search).get('token') ?? '';

// withNext mantiene ?next= al pasar entre ingresar y crear cuenta.
const withNext = (path: string) => {
  const next = nextParam();
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
};

function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

  const run = async (action: () => Promise<void>) => {
    setLoading(true);
    setError('');
    setFields({});
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiError) {
        setFields(err.fields);
        if (Object.keys(err.fields).length === 0) setError(err.message);
      } else {
        setError('Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, fields, run };
}

function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <h1 className="font-display text-3xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-8 space-y-5">{children}</div>
      {footer && <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">{footer}</div>}
    </Card>
  );
}

async function login(email: string, password: string) {
  const data = await api<{ authentication_token: AuthToken }>('/v1/tokens/authentication', { method: 'POST', body: { email, password } });
  saveSession(data.authentication_token);
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, fields, run } = useSubmit();
  const goNext = useCallback(() => window.location.assign(safeNext(nextParam())), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await login(email.trim(), password);
      goNext();
    });
  };

  return (
    <AuthCard
      title="Ingresa a tu cuenta"
      subtitle="Para ver tus cursos y continuar donde te quedaste."
      footer={
        <>
          ¿Aún no tienes cuenta?{' '}
          <a className="font-semibold text-[var(--primary)] hover:underline" href={withNext('/registro')}>
            Crea una gratis
          </a>
        </>
      }
    >
      <GoogleButton onSignedIn={goNext} />
      <form className="space-y-5" onSubmit={submit} noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Correo" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} />
        <Field label="Contraseña" type="password" name="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={fields.password} />
        <div className="flex justify-end">
          <a href="/recuperar" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <Button type="submit" loading={loading} className="w-full">
          Ingresar
        </Button>
      </form>
    </AuthCard>
  );
}

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loading, error, fields, run } = useSubmit();
  const goNext = useCallback(() => window.location.assign(safeNext(nextParam())), []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api('/v1/users', { method: 'POST', body: { name: name.trim(), email: email.trim(), password } });
      // La cuenta ya puede ingresar; para comprar falta activarla con el correo.
      await login(email.trim(), password);
      goNext();
    });
  };

  return (
    <AuthCard
      title="Crea tu cuenta"
      subtitle="Te enviaremos un correo para activarla."
      footer={
        <>
          ¿Ya tienes cuenta?{' '}
          <a className="font-semibold text-[var(--primary)] hover:underline" href={withNext('/ingresar')}>
            Ingresa
          </a>
        </>
      }
    >
      <GoogleButton onSignedIn={goNext} />
      <form className="space-y-5" onSubmit={submit} noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Field label="Nombre y apellido" name="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} error={fields.name} />
        <Field label="Correo" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} />
        <Field
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fields.password}
          hint="Al menos 8 caracteres."
        />
        <Button type="submit" loading={loading} className="w-full">
          Crear cuenta
        </Button>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { loading, error, fields, run } = useSubmit();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api('/v1/tokens/password-reset', { method: 'POST', body: { email: email.trim() } });
      setSent(true);
    });
  };

  return (
    <AuthCard title="Recupera tu contraseña" subtitle="Te enviaremos un enlace para crear una nueva." footer={<a className="font-semibold text-[var(--primary)] hover:underline" href="/ingresar">Volver a ingresar</a>}>
      {sent ? (
        <Alert tone="success">Listo. Revisa tu correo ({email}) y abre el enlace para crear una nueva contraseña. Vence en 45 minutos.</Alert>
      ) : (
        <form className="space-y-5" onSubmit={submit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="Correo" type="email" name="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={fields.email} />
          <Button type="submit" loading={loading} className="w-full">
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const { loading, error, fields, run } = useSubmit();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api('/v1/users/password', { method: 'PUT', body: { password, token: tokenParam() } });
      setDone(true);
    });
  };

  return (
    <AuthCard title="Crea una nueva contraseña">
      {done ? (
        <div className="space-y-5">
          <Alert tone="success">Tu contraseña se cambió. Ya puedes ingresar con ella.</Alert>
          <LinkButton href="/ingresar" className="w-full">
            Ingresar
          </LinkButton>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={submit} noValidate>
          {(error || fields.token) && <Alert tone="error">{error || fields.token}</Alert>}
          <Field
            label="Nueva contraseña"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fields.password}
            hint="Al menos 8 caracteres."
          />
          <Button type="submit" loading={loading} className="w-full">
            Guardar contraseña
          </Button>
          {fields.token && (
            <p className="text-center text-sm">
              <a href="/recuperar" className="font-semibold text-[var(--primary)] hover:underline">
                Pedir un enlace nuevo
              </a>
            </p>
          )}
        </form>
      )}
    </AuthCard>
  );
}

export function ActivateAccount() {
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/v1/users/activated', { method: 'PUT', body: { token: tokenParam() } })
      .then(() => setState('done'))
      .catch((err) => {
        setMessage(err instanceof ApiError ? err.message : 'No pudimos activar tu cuenta.');
        setState('error');
      });
  }, []);

  return (
    <AuthCard title="Activa tu cuenta">
      {state === 'working' && <Loading label="Activando tu cuenta…" />}
      {state === 'done' && (
        <div className="space-y-5">
          <Alert tone="success">¡Tu cuenta está activa! Ya puedes comprar cursos y verlos.</Alert>
          <LinkButton href="/cursos" className="w-full">
            Ver cursos
          </LinkButton>
        </div>
      )}
      {state === 'error' && (
        <div className="space-y-5">
          <Alert tone="error">{message}</Alert>
          <LinkButton href="/mi-cuenta" variant="secondary" className="w-full">
            Pedir otro enlace desde Mi cuenta
          </LinkButton>
        </div>
      )}
    </AuthCard>
  );
}
