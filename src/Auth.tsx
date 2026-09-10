import { useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase, isOwner } from './lib/supabase';

export type AuthUser = { id: string; email?: string; name?: string; avatar?: string; owner: boolean };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? mapUser(u) : null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? mapUser(u) : null);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signOut = async () => { await supabase?.auth.signOut(); };
  return { user, loading, signInWithGoogle, signOut, configured: !!supabase };
}

function mapUser(u: { id: string; email?: string; user_metadata?: Record<string, string> }): AuthUser {
  const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
  const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
  return { id: u.id, email: u.email, name, avatar, owner: isOwner(u.email) };
}

export function AuthPage({ onBack }: { onBack: () => void }) {
  const { signInWithGoogle, configured } = useAuth();
  const [error, setError] = useState('');
  const login = async () => { setError(''); try { await signInWithGoogle(); } catch (e) { setError(e instanceof Error ? e.message : 'Google sign-in failed'); } };
  return <div className="auth-page"><div className="auth-card"><div className="auth-logo">C</div><h1>Welcome to Crazy SEO Team</h1><p>Login or create your account securely with your Google/Gmail account.</p><button className="google-btn" onClick={login}><span>G</span><b><LogIn size={16}/> Continue with Google</b></button><div className="auth-create"><UserPlus size={15}/> New users automatically get an account after Google sign-in.</div>{error && <div className="auth-error">{error}</div>}{!configured && <div className="auth-warning">Supabase OAuth is not configured yet. Add the two Vite Supabase environment variables in your deployment.</div>}<button className="back-btn" onClick={onBack}>← Back to website</button></div></div>;
}

export function UserBadge({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return <div className="user-badge">{user.avatar ? <img src={user.avatar} alt=""/> : <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{user.owner ? 'Owner' : 'Member'}</small></div><button title="Logout" onClick={onLogout}><LogOut size={15}/></button>{user.owner && <ShieldCheck size={15}/>}</div>;
}
