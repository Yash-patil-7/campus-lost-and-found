import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { ShieldCheck, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Incorrect email or password.');
      }

      const data = await res.json();
      login(data.access_token, {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        created_at: new Date().toISOString(),
      });

      if (data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const fillTestAccount = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Campus Lost & Found</h1>
          <p className="text-xs text-slate-400">Structured System of Record for College Lost & Found Cases</p>
        </div>

        <div className="glass-panel p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Seed Quick Test Buttons */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Development Quick-Fill Test Accounts
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillTestAccount('student1.test@campus.edu', 'Student@12345')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-[11px] text-slate-300 transition text-center"
              >
                <div className="font-bold">Student A</div>
                <div className="text-[9px] text-slate-500">student1</div>
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('student2.test@campus.edu', 'Student@12345')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-slate-300 transition text-center"
              >
                <div className="font-bold">Student B</div>
                <div className="text-[9px] text-slate-500">student2</div>
              </button>
              <button
                type="button"
                onClick={() => fillTestAccount('admin.test@campus.edu', 'Admin@12345')}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-[11px] text-amber-400 transition text-center"
              >
                <div className="font-bold">Admin</div>
                <div className="text-[9px] text-slate-500">admin.test</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400">
          New campus student?{' '}
          <Link to="/register" className="font-semibold text-sky-400 hover:underline">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};
