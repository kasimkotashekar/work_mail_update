'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem('workmail_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (remember) {
        localStorage.setItem('workmail_saved_email', email);
      } else {
        localStorage.removeItem('workmail_saved_email');
      }

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#070B1A] to-[#0B1026] flex items-center justify-center overflow-hidden relative p-5">
      {/* Particles Background */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-yellow-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `float ${Math.random() * 3 + 3}s linear infinite, twinkle 3s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100vh) translateX(50px);
            opacity: 0;
          }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-float {
          will-change: transform;
        }
      `}</style>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-black/40 backdrop-blur-md rounded-[20px] p-[50px] shadow-2xl border border-yellow-400/10 animate-in fade-in zoom-in-95 duration-600"
             style={{ animation: 'popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>

          {/* Logo Branding */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-top-3 duration-600 delay-100"
               style={{ animation: 'fadeInUp 0.6s ease-out 0.25s both' }}>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-14 h-14 bg-yellow-400 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 6l10 8 10-8"></path>
                </svg>
              </div>
              <div className="flex gap-1 items-baseline">
                <span className="text-2xl font-bold text-white">Work</span>
                <span className="text-2xl font-bold text-yellow-400">Mail</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 relative pb-5 border-b border-yellow-400/30"
               style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
            <h1 className="text-2xl font-bold text-white tracking-widest">LOGIN</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-shake"
                 style={{ animation: 'shake 0.4s ease' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-10" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-gray-400 text-xs mb-2 tracking-widest">EMAIL ADDRESS</label>
              <div className="flex items-center bg-transparent border-b border-gray-600 p-3 hover:border-yellow-400/50 transition">
                <svg className="w-5 h-5 text-yellow-400 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent outline-none text-white placeholder-gray-600 text-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-gray-400 text-xs mb-2 tracking-widest">PASSWORD</label>
              <div className="flex items-center bg-transparent border-b border-gray-600 p-3 hover:border-yellow-400/50 transition">
                <svg className="w-5 h-5 text-yellow-400 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-2-2h-6v2h6V6z"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent outline-none text-white placeholder-gray-600 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-yellow-400 text-lg ml-2"
                >
                  {showPassword ? '👁️' : '👁️'}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex justify-between items-center mb-8 text-xs">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-3 h-3 accent-yellow-400"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-yellow-400 hover:text-yellow-300 transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-bold tracking-wider rounded-lg transition hover:shadow-lg hover:shadow-yellow-400/50 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  SIGNING IN...
                </span>
              ) : (
                'LOGIN'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-8 text-xs text-gray-600">
            <div className="flex-1 h-px bg-gray-600"></div>
            <span>Or Login With</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
            <button
              type="button"
              className="py-3 bg-transparent border border-gray-600 rounded-lg text-white text-xs font-semibold hover:bg-yellow-400/10 hover:border-yellow-400/50 transition"
            >
              Google
            </button>
            <button
              type="button"
              className="py-3 bg-transparent border border-gray-600 rounded-lg text-white text-xs font-semibold hover:bg-yellow-400/10 hover:border-yellow-400/50 transition"
            >
              Facebook
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 rounded-2xl p-10 text-center border border-yellow-400/20">
            <div className="w-20 h-20 mx-auto mb-5 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center text-4xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Login Successful!</h2>
            <p className="text-gray-400 mb-6">Welcome back! Redirecting to dashboard...</p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/90 rounded-2xl p-10 border border-yellow-400/20 max-w-sm">
            <h2 className="text-2xl font-bold text-white mb-3">Reset Password</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full bg-transparent border-b border-gray-600 p-3 text-white text-sm mb-6 outline-none placeholder-gray-600"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowForgot(false)}
                className="flex-1 py-2 bg-transparent border border-gray-600 text-gray-400 rounded-lg hover:bg-yellow-400/10 hover:border-yellow-400/50 transition text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                className="flex-1 py-2 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black rounded-lg hover:shadow-lg hover:shadow-yellow-400/50 transition text-sm font-semibold"
              >
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
