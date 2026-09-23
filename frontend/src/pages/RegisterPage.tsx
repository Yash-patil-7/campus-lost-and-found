import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { ShieldCheck, UserPlus, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          roll_number: rollNumber,
          department,
          phone,
          role: 'STUDENT',
        }),
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Student Registration</h1>
          <p className="text-xs text-slate-400">Join the official Campus Lost & Found System</p>
        </div>

        <div className="glass-panel p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campus Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.j@campus.edu"
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Roll / Student ID</label>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="2026-CS-101"
                  className="w-full glass-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="CS / EE / Mechanical"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0199"
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
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-sky-400 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
