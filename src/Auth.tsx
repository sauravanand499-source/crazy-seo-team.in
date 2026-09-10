import { useEffect, useState } from 'react';
import { LogIn, LogOut, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase, isOwner } from './lib/supabase';

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

  const sendPhoneOtp = async (phone: string) => {
    const clean = phone.replace(/[\s()-]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(clean)) {
      throw new Error('Enter your mobile number with country code, e.g. +919876543210');
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: clean });
    if (error) throw error;
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const clean = phone.replace(/[\s()-]/g, '');
    const code = token.replace(/\D/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(clean)) throw new Error('Invalid mobile number.');
    if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit OTP.');
    const { error } = await supabase.auth.verifyOtp({ phone: clean, token: code, type: 'sms' });
    if (error) throw error;
  };

  const resendPhoneOtp = async (phone: string) => sendPhoneOtp(phone);
  const signOut = async () => { await supabase.auth.signOut(); };
  return { user, loading, sendPhoneOtp, verifyPhoneOtp, resendPhoneOtp, signOut, configured: true };
}

function mapUser(u: { id: string; email?: string; phone?: string; user_metadata?: Record<string, string> }): AuthUser {
  const name = u.user_metadata?.full_name || u.user_metadata?.name || u.phone || u.email?.split('@')[0] || 'User';
  const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
  return { id: u.id, email: u.email, phone: u.phone, name, avatar, owner: isOwner(u.email) };
}

export function AuthPage({ onBack }: { onBack: () => void }) {
  const { sendPhoneOtp, verifyPhoneOtp, resendPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await sendPhoneOtp(phone);
      setStep('otp');
      setMessage('OTP sent to your mobile number. Check your SMS.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP');
    } finally { setBusy(false); }
  };

  const verifyCode = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await verifyPhoneOtp(phone, otp);
      setMessage('Mobile verified. Your account is ready.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      await resendPhoneOtp(phone);
      setMessage('A new OTP has been sent to your mobile.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resend OTP');
    } finally { setBusy(false); }
  };

  return <div className="auth-page"><div className="auth-card"><div className="auth-logo">C</div><h1>Welcome to Crazy SEO Team</h1><p>Create your account or login using your mobile number.</p>{step === 'phone' ? <><div className="phone-label"><Phone size={16}/> Mobile number</div><input className="auth-input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 9876543210" autoComplete="tel"/><button className="primary auth-main-btn" onClick={sendCode} disabled={busy}><Phone size={17}/> {busy ? 'Sending OTP…' : 'Send OTP'}</button><div className="auth-create"><UserPlus size={15}/> New users are automatically registered after OTP verification.</div></> : <><div className="otp-title">Enter the 6-digit OTP sent to <strong>{phone}</strong></div><input className="auth-input otp-input" inputMode="numeric" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="••••••" autoComplete="one-time-code"/><button className="primary auth-main-btn" onClick={verifyCode} disabled={busy}><LogIn size={17}/> {busy ? 'Verifying…' : 'Verify OTP & Login'}</button><button className="secondary-btn" onClick={resend} disabled={busy}>Resend OTP</button><button className="back-btn" onClick={()=>{setStep('phone');setOtp('');setError('');setMessage('')}}>← Change mobile number</button></>}{message && <div className="auth-success">{message}</div>}{error && <div className="auth-error">{error}</div>}<button className="back-btn" onClick={onBack}>← Back to website</button></div></div>;
}

export function UserBadge({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return <div className="user-badge">{user.avatar ? <img src={user.avatar} alt=""/> : <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>}<div><strong>{user.name}</strong><small>{user.owner ? 'Owner' : 'Member'}</small></div><button title="Logout" onClick={onLogout}><LogOut size={15}/></button>{user.owner && <ShieldCheck size={15}/>}</div>;
}
