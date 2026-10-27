// Muestra el panel solo a admins. La API valida el permiso en cada pedido; esto solo
// evita mostrar un panel vacío a quien no lo tiene.

import { useEffect, useState, type ReactNode } from 'react';
import { getToken, loadMe } from '../../lib/platform/api';
import { Alert, Loading } from './ui';

export default function AdminGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    const login = () => window.location.replace(`/ingresar?next=${encodeURIComponent(window.location.pathname)}`);
    if (!getToken()) return login();
    loadMe()
      .then((me) => (me ? setState(me.is_admin ? 'allowed' : 'denied') : login()))
      .catch(() => setState('denied'));
  }, []);

  if (state === 'loading') return <Loading />;
  if (state === 'denied') return <Alert tone="error">No tienes permiso para ver esta sección.</Alert>;
  return <>{children}</>;
}
