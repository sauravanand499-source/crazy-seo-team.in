import { useEffect, useState } from 'react';
import { LogIn, LogOut, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase, isOwner } from './lib/supabase';

export type AuthUser = { id: string; email?: string; name?: string; avatar?: string; owner: boolean };

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Please enter your Gmail/email address.');
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  };

  const signOut = async () => { await supabase.auth.signOut(); };
  return { user, loading, signInWithGoogle, signInWithEmail, signOut, configured: true };
}

function mapUser(u: { id: string; email?: string; user_metadata?: Record<string, string> }): AuthUser {
  const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
  const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
  return { id: u.id, email: u.email, name, avatar, owner: isOwner(u.email) };
}

export function AuthPage({ onBack }: { onBack: () => void }) {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loginGoogle = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Google sign-in failed';
      setError(text.includes('Unsupported provider') || text.includes('provider is not enabled')
        ? 'Google login is not enabled in Supabase yet. Use Gmail email-link login below, or enable Google OAuth in Supabase.'
        : text);
      setBusy(false);
    }
  };

  const loginEmail = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await signInWithEmail(email);
      setMessage('Login link sent. Check your Gmail inbox and open the link to continue.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Email login failed');
    } finally {
      setBusy(false);
    }
  };

  return <div className="auth-page"><div className="auth-card"><div className="auth-logo">C</div><h1>Welcome to Crazy SEO Team</h1><p>Login or create your account securely with Google/Gmail.</p><button className="google-btn" onClick={loginGoogle} disabled={busy}><span>G</span><b><LogIn size={16}/> Continue with Google</b></button><div className="auth-divider"><span>or use Gmail</span></div><div className="email-login"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email"/><button className="primary" onClick={loginEmail} disabled={busy}><Mail size={16}/> Send login link</button></div><div className="auth-create"><UserPlus size={15}/> New users automatically get an account after the first successful login.</div>{message && <div className="auth-success">{message}</div>}{error && <div className="auth-error">{error}</div>}<button className="back-btn" onClick={onBack}>← Back to website</button></div></div>;
}

export function UserBadge({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return <div className="user-badge">{user.avatar ? <img src={user.avatar} alt=""/> : <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{user.owner ? 'Owner' : 'Member'}</small></div><button title="Logout" onClick={onLogout}><LogOut size={15}/></button>{user.owner && <ShieldCheck size={15}/>}</div>;
}
