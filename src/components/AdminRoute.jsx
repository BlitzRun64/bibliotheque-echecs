import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminRoute({ children }) {
  const [session, setSession] = useState(undefined);
  const [profil, setProfil] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) {
      setProfil(null);
      return;
    }
    supabase
      .from('profils')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfil(data));
  }, [session]);

  if (session === undefined || (session && profil === undefined)) {
    return <div>Chargement...</div>;
  }

  if (!session || !profil?.est_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}