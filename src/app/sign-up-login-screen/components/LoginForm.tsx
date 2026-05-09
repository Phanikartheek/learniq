'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { addToast } from '@/components/ui/Toast';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // Listen for autofill events from demo credentials
  useEffect(() => {
    const handler = (e: Event) => {
      const { email, password } = (e as CustomEvent).detail;
      setValue('email', email);
      setValue('password', password);
      setAuthError('');
    };
    window.addEventListener('learniq:autofill', handler);
    return () => window.removeEventListener('learniq:autofill', handler);
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setAuthError('');
    // BACKEND INTEGRATION: Replace with real JWT login API call
    const success = await login(data.email, data.password);
    if (success) {
      addToast({ type: 'success', title: 'Welcome back!', description: 'Redirecting to your dashboard…' });
      setTimeout(() => router.push('/'), 800);
    } else {
      setAuthError('Invalid credentials — use the demo accounts below to sign in.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-bold text-xl text-foreground">Sign in to LearnIQ</h3>
        <p className="text-sm text-muted-foreground mt-1">Continue your interview prep journey.</p>
      </div>

      {authError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-400 animate-fade-in">
          {authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-foreground mb-1.5">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`
              w-full px-4 py-2.5 rounded-xl bg-input border text-foreground text-sm
              placeholder:text-muted-foreground/60
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
              transition-all duration-150
              ${errors.email ? 'border-red-500/60' : 'border-border'}
            `}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`
                w-full px-4 py-2.5 pr-11 rounded-xl bg-input border text-foreground text-sm
                placeholder:text-muted-foreground/60
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                transition-all duration-150
                ${errors.password ? 'border-red-500/60' : 'border-border'}
              `}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            id="login-remember"
            type="checkbox"
            className="w-4 h-4 rounded border-border bg-input text-primary focus:ring-ring"
            {...register('rememberMe')}
          />
          <label htmlFor="login-remember" className="text-sm text-muted-foreground">
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full flex items-center justify-center gap-2
            py-3 px-6 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-primary via-accent to-cyan-accent
            hover:opacity-90 active:scale-95
            disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
            transition-all duration-150 glow-primary
          "
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to LearnIQ?{' '}
        <button
          onClick={onSwitchToRegister}
          className="text-primary font-medium hover:text-primary/80 transition-colors"
        >
          Create a free account
        </button>
      </p>
    </div>
  );
}