// Menú de cuenta del header: "Ingresar" sin sesión, o el nombre con Mi cuenta, el panel
// admin (solo para Karolay) y Salir.

import { useEffect, useRef, useState } from 'react';
import { clearSession, getToken, loadMe, onSessionChange } from '../../lib/platform/api';
import type { Me } from '../../lib/platform/types';

export default function AccountMenu() {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      if (!getToken()) {
        setMe(null);
        setReady(true);
        return;
      }
      loadMe()
        .then(setMe)
        .catch(() => setMe(null))
        .finally(() => setReady(true));
    };
    load();
    return onSessionChange(load);
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menu.current && !menu.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  if (!ready) return <span className="inline-block h-10 w-24" />;

  if (!me) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    // En estas páginas no se vuelve después de ingresar, y /restablecer y /activar llevan
    // un token en la URL que no debe copiarse a ?next=.
    const onAuthPage = ['/ingresar', '/registro', '/recuperar', '/restablecer', '/activar'].includes(window.location.pathname);
    return (
      <a
        href={onAuthPage ? '/ingresar' : `/ingresar?next=${next}`}
        className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-800"
      >
        Ingresar
      </a>
    );
  }

  const firstName = me.user.name.split(' ')[0] || me.user.email;

  return (
    <div className="relative" ref={menu}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-violet-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-white">{firstName.charAt(0).toUpperCase()}</span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{firstName}</span>
        <span className="material-symbols-outlined text-base text-slate-400">expand_more</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl bg-white py-2 shadow-xl ring-1 ring-slate-100">
          <p className="truncate px-4 pb-2 text-xs text-slate-500">{me.user.email}</p>
          <MenuLink href="/mi-cuenta" icon="person">Mi cuenta</MenuLink>
          <MenuLink href="/cursos" icon="school">Cursos</MenuLink>
          {me.is_admin && (
            <>
              <p className="mt-2 border-t border-slate-100 px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Administración</p>
              <MenuLink href="/admin/pagos" icon="payments">Pagos</MenuLink>
              <MenuLink href="/admin/cupones" icon="sell">Cupones</MenuLink>
              <MenuLink href="/admin/suscriptores" icon="group">Suscriptores</MenuLink>
              <MenuLink href="/admin/reclamos" icon="menu_book">Reclamos</MenuLink>
            </>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              clearSession();
              window.location.href = '/';
            }}
            className="mt-2 flex w-full items-center gap-3 border-t border-slate-100 px-4 pt-3 pb-1 text-left text-sm text-slate-600 hover:text-[var(--primary)]"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Salir
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: string; children: string }) {
  return (
    <a role="menuitem" href={href} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-[var(--primary)]">
      <span className="material-symbols-outlined text-lg">{icon}</span>
      {children}
    </a>
  );
}
