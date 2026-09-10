import { useEffect, useState } from 'react';
import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { supabase, isOwner, OWNER_EMAILS } from './lib/supabase';

export type AuthUser = { id: string; email?: string; phone?: string; name?: string; avatar?: string; owner: boolean };

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

  const signInWithEmail = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!OWNER_EMAILS.includes(cleanEmail)) {
      throw new Error('This email is not authorized. Only the two Crazy SEO Team owner accounts can sign in.');
    }
    if (!password) throw new Error('Enter your password.');
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw error;
  };

  const signOut = async () => { await supabase.auth.signOut(); };
  return { user, loading, signInWithEmail, signOut, configured: true };
}

function mapUser(u: { id: string; email?: string; phone?: string; user_metadata?: Record<string, string> }): AuthUser {
  const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || u.phone || 'User';
  const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
  return { id: u.id, email: u.email, phone: u.phone, name, avatar, owner: isOwner(u.email) };
}

export function AuthPage({ onBack }: { onBack: () => void }) {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await signInWithEmail(email, password);
      setMessage('Login successful. Opening your workspace…');
      window.setTimeout(() => {
        window.location.href = window.location.pathname === '/admin' ? '/admin' : '/dashboard';
      }, 150);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally { setBusy(false); }
  };

  return <div className="auth-page"><div className="auth-card"><div className="auth-logo">C</div><h1>Crazy SEO Team Login</h1><p>Secure owner login. Only the two authorized Crazy SEO Team accounts can open the workspace.</p><div className="phone-label"><ShieldCheck size={16}/> Authorized email</div><input className="auth-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter authorized email" autoComplete="username"/><div className="phone-label"><LogIn size={16}/> Password</div><input className="auth-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" onKeyDown={e=>{if(e.key==='Enter') login();}}/><button className="primary auth-main-btn" onClick={login} disabled={busy}><LogIn size={17}/> {busy ? 'Signing in…' : 'Login'}</button><div className="auth-create"><ShieldCheck size={15}/> Access is limited to the configured owner email allowlist.</div>{message && <div className="auth-success">{message}</div>}{error && <div className="auth-error">{error}</div>}<button className="back-btn" onClick={onBack}>← Back to website</button></div></div>;
}

export function UserBadge({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return <div className="user-badge">{user.avatar ? <img src={user.avatar} alt=""/> : <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{user.owner ? 'Owner' : 'Member'}</small></div><button title="Logout" onClick={onLogout}><LogOut size={15}/></button>{user.owner && <ShieldCheck size={15}/>}</div>;
}
