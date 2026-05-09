'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/store/authStore';
import { addToast } from '@/components/ui/Toast';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  terms: boolean;
}

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'student', label: 'Student', desc: 'Preparing for campus placements or internships' },
  { value: 'professional', label: 'Professional', desc: 'Targeting senior roles or career switch' },
];

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register: registerUser, isLoading } = useAuthStore();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'student', terms: false },
  });

  const watchPassword = watch('password');
  const watchRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    // BACKEND INTEGRATION: Replace with real registration API call
    const success = await registerUser(data.name, data.email, data.password, data.role);
    if (success) {
      addToast({ type: 'success', title: 'Account created!', description: 'Welcome to LearnIQ — let\'s get started.' });
      setTimeout(() => router.push('/'), 800);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display font-bold text-xl text-foreground">Create your account</h3>
        <p className="text-sm text-muted-foreground mt-1">Start your interview preparation today — free forever.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full name */}
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            placeholder="Arjun Sharma"
            className={`w-full px-4 py-2.5 rounded-xl bg-input border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150 ${errors.name ? 'border-red-500/60' : 'border-border'}`}
            {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Name must be at least 2 characters' } })}
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full px-4 py-2.5 rounded-xl bg-input border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150 ${errors.email ? 'border-red-500/60' : 'border-border'}`}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
            })}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
        </div>

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">I am a…</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <label
                key={`role-${r.value}`}
                htmlFor={`role-${r.value}`}
                className={`
                  flex flex-col gap-1 p-3 rounded-xl border cursor-pointer transition-all duration-150
                  ${watchRole === r.value
                    ? 'border-primary/60 bg-primary/10 text-primary' :'border-border bg-input/50 text-muted-foreground hover:border-border/80 hover:text-foreground'
                  }
                `}
              >
                <input
                  id={`role-${r.value}`}
                  type="radio"
                  value={r.value}
                  className="sr-only"
                  {...register('role')}
                />
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-[11px] leading-tight opacity-80">{r.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <p className="text-xs text-muted-foreground mb-1.5">Min. 8 characters with a number and symbol</p>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-input border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150 ${errors.password ? 'border-red-500/60' : 'border-border'}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters required' },
                pattern: { value: /^(?=.*[0-9])(?=.*[!@#$%^&*])/, message: 'Must include a number and a symbol' },
              })}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="reg-confirm" className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
          <div className="relative">
            <input
              id="reg-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`w-full px-4 py-2.5 pr-11 rounded-xl bg-input border text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-150 ${errors.confirmPassword ? 'border-red-500/60' : 'border-border'}`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === watchPassword || 'Passwords do not match',
              })}
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        {/* Terms */}
        <div>
          <div className="flex items-start gap-2">
            <input
              id="reg-terms"
              type="checkbox"
              className="w-4 h-4 mt-0.5 rounded border-border bg-input text-primary focus:ring-ring flex-shrink-0"
              {...register('terms', { required: 'You must accept the terms to continue' })}
            />
            <label htmlFor="reg-terms" className="text-sm text-muted-foreground leading-relaxed">
              I agree to the{' '}
              <span className="text-primary hover:text-primary/80 cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span className="text-primary hover:text-primary/80 cursor-pointer">Privacy Policy</span>
            </label>
          </div>
          {errors.terms && <p className="mt-1.5 text-xs text-red-400">{errors.terms.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-primary via-accent to-cyan-accent hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-150 glow-primary"
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /><span>Creating account…</span></>
          ) : (
            <><UserPlus size={16} /><span>Create Account</span></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-primary font-medium hover:text-primary/80 transition-colors">
          Sign in
        </button>
      </p>
    </div>
  );
}