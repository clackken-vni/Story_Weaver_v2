'use client';

import { useCallback, useMemo, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { adminApi } from '../lib/api';
import { NeoPrintButton, NeoPrintCard, NeoPrintTag } from './neo-print';

interface LoginPageProps {
  onLoginSuccess: () => void;
  notice?: string | null;
}

const LOGIN_BRIEF = [
  { label: 'Edition', value: 'Admin Access Ledger' },
  { label: 'Status', value: 'Guarded Entry' },
  { label: 'Channel', value: 'StoryWeaver Control Desk' },
] as const;

const LOGIN_SIGNALS = [
  { label: 'Success Rate', value: '98.9%' },
  { label: 'Challenge Rate', value: '17%' },
  { label: 'Threat Flags', value: '2' },
] as const;

const OAUTH_PROVIDERS = [
  {
    name: 'Google',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    name: 'GitHub',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.565 21.797 24 17.3 24 12 24 5.373 18.627 0 12 0z" />
      </svg>
    ),
  },
] as const;

export default function LoginPage({ onLoginSuccess, notice }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const edition = useMemo(() => new Date().toLocaleDateString('en-GB'), []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) {
        setError('Email and password are required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await adminApi.login(email, password);
        if (result.access_token) {
          localStorage.setItem('admin_token', result.access_token);
          onLoginSuccess();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setLoading(false);
      }
    },
    [email, password, onLoginSuccess]
  );

  return (
    <main className="np-login-page">
      <section className="np-login-shell">
        <header className="np-login-masthead">
          <div className="np-login-edition-row">
            <NeoPrintTag tone="accent">Admin Bulletin</NeoPrintTag>
            <span className="np-login-kicker">Edition {edition}</span>
          </div>
          <div className="np-login-headline-grid">
            <div className="np-login-headline-panel">
              <p className="np-login-eyebrow">Restricted circulation</p>
              <h1 className="np-login-title">Access Noticeboard</h1>
              <p className="np-login-strapline">
                Sign in through the editorial gate. Every credential check, challenge, and escalation stays on the same Neo-Print system used across the rest of the admin desk.
              </p>
            </div>
            <NeoPrintCard tone="muted" style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
              <div>
                <p className="np-login-side-label">Lead signal</p>
                <p className="np-login-side-copy">Entry attempts and trust score.</p>
              </div>
              <div className="np-login-brief-grid">
                {LOGIN_BRIEF.map((item) => (
                  <div key={item.label} className="np-login-brief-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </NeoPrintCard>
          </div>
        </header>

        <section className="np-login-body-grid">
          <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-5)' }}>
            <div className="np-login-section-heading">
              <p className="np-login-section-kicker">Access desk</p>
              <h2 className="np-login-section-title">Sign in to your account</h2>
            </div>

            {notice ? (
              <div className="np-login-notice" role="status" aria-live="polite">
                {notice}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="np-login-form">
              <label className="np-login-field">
                <span className="np-login-label">Email address</span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="np-login-input"
                  placeholder="admin@storyweaver.ai"
                  autoComplete="email"
                  autoFocus
                  aria-invalid={error ? 'true' : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </label>

              <label className="np-login-field">
                <span className="np-login-label">Password</span>
                <div className="np-login-password-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="np-login-input np-login-input--password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? 'login-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="np-login-password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <div className="np-login-options">
                <label className="np-login-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="np-login-checkbox"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="np-login-forgot">
                  Forgot password?
                </a>
              </div>

              {error ? (
                <div id="login-error" className="np-login-error" role="alert" aria-live="assertive">
                  {error}
                </div>
              ) : null}

              <NeoPrintButton type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Signing In...' : 'Sign In'}
              </NeoPrintButton>
            </form>

            <div className="np-login-divider">
              <span>Or continue with</span>
            </div>

            <div className="np-login-oauth-grid">
              {OAUTH_PROVIDERS.map((provider) => (
                <NeoPrintButton key={provider.name} type="button" variant="secondary" style={{ width: '100%' }}>
                  {provider.icon}
                  {provider.name}
                </NeoPrintButton>
              ))}
            </div>
          </NeoPrintCard>

          <div className="np-login-side-stack">
            <NeoPrintCard tone="muted" style={{ display: 'grid', gap: 'var(--space-4)' }}>
              <div className="np-login-section-heading">
                <p className="np-login-section-kicker">Trust score</p>
                <h2 className="np-login-section-title">Entry signals</h2>
              </div>
              <div className="np-login-signal-grid">
                {LOGIN_SIGNALS.map((item) => (
                  <div key={item.label} className="np-login-signal-item">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </NeoPrintCard>

            <NeoPrintCard style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <div className="np-login-security-row">
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Protected by StoryWeaver Security</span>
              </div>
              <p className="np-login-side-copy">
                Session handoff, RBAC, and downstream routes stay unchanged. This page only replaces the visual layer with the Neo-Print editorial system.
              </p>
            </NeoPrintCard>
          </div>
        </section>
      </section>

      <style jsx>{`
        .np-login-page {
          min-height: 100vh;
          padding: clamp(20px, 4vw, 40px);
          background: var(--np-bg);
          color: var(--np-ink);
        }

        .np-login-shell {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          gap: var(--space-6);
        }

        .np-login-masthead {
          display: grid;
          gap: var(--space-4);
        }

        .np-login-edition-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .np-login-kicker,
        .np-login-eyebrow,
        .np-login-side-label,
        .np-login-section-kicker,
        .np-login-label,
        .np-login-brief-item span,
        .np-login-signal-item span,
        .np-login-divider,
        .np-login-forgot {
          font-family: var(--np-font-body);
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--np-muted);
        }

        .np-login-headline-grid,
        .np-login-body-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.8fr);
          gap: var(--space-4);
        }

        .np-login-headline-panel {
          border: 1px solid var(--np-line);
          background: var(--np-surface);
          padding: clamp(20px, 4vw, 36px);
          box-shadow: var(--np-shadow);
        }

        .np-login-title,
        .np-login-section-title,
        .np-login-side-copy strong {
          font-family: var(--np-font-display);
          color: var(--np-ink);
        }

        .np-login-title {
          margin-top: var(--space-2);
          font-size: clamp(3.2rem, 2.4rem + 2.8vw, 5.8rem);
          line-height: 0.9;
          letter-spacing: -0.02em;
          max-width: 8ch;
        }

        .np-login-strapline {
          margin-top: var(--space-4);
          max-width: 56ch;
          font-family: var(--np-font-body);
          font-size: 1rem;
          line-height: 1.7;
          color: var(--np-muted);
        }

        .np-login-side-copy {
          font-family: var(--np-font-body);
          font-size: var(--text-sm);
          line-height: 1.6;
          color: var(--np-muted);
        }

        .np-login-brief-grid,
        .np-login-signal-grid {
          display: grid;
          gap: 10px;
        }

        .np-login-brief-item,
        .np-login-signal-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: var(--space-3);
          padding-top: 10px;
          border-top: 1px solid var(--np-line);
        }

        .np-login-brief-item strong,
        .np-login-signal-item strong {
          font-family: var(--np-font-display);
          font-size: 1.125rem;
          line-height: 1;
          color: var(--np-ink);
          text-align: right;
        }

        .np-login-section-heading {
          display: grid;
          gap: 6px;
        }

        .np-login-section-title {
          font-size: clamp(1.8rem, 1.4rem + 0.8vw, 2.5rem);
          line-height: 0.96;
        }

        .np-login-form {
          display: grid;
          gap: var(--space-4);
        }

        .np-login-field {
          display: grid;
          gap: 8px;
        }

        .np-login-input,
        .np-login-checkbox,
        .np-login-password-toggle,
        .np-login-remember,
        .np-login-forgot {
          font-family: var(--np-font-body);
        }

        .np-login-input {
          width: 100%;
          min-height: 48px;
          border: 1px solid var(--np-line);
          border-radius: 0;
          background: var(--np-surface);
          color: var(--np-ink);
          padding: 12px 14px;
          font-size: 0.95rem;
          outline: none;
        }

        .np-login-input::placeholder {
          color: var(--np-muted);
          opacity: 0.9;
        }

        .np-login-input:focus {
          border-color: var(--np-accent);
          box-shadow: inset 0 0 0 1px var(--np-accent);
        }

        .np-login-input--password {
          padding-right: 46px;
        }

        .np-login-password-wrap {
          position: relative;
        }

        .np-login-password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid transparent;
          border-radius: 0;
          color: var(--np-muted);
          background: transparent;
          cursor: pointer;
        }

        .np-login-password-toggle:hover {
          color: var(--np-accent);
          border-color: var(--np-line);
        }

        .np-login-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .np-login-remember {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .np-login-checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--np-accent);
        }

        .np-login-forgot {
          text-decoration: none;
        }

        .np-login-forgot:hover {
          color: var(--np-accent);
        }

        .np-login-notice,
        .np-login-error {
          border: 1px solid;
          border-radius: 0;
          padding: 12px 14px;
          font-family: var(--np-font-body);
          font-size: var(--text-sm);
          line-height: 1.6;
        }

        .np-login-notice {
          border-color: var(--status-degraded);
          background: var(--status-degraded-bg);
          color: var(--np-ink);
        }

        .np-login-error {
          border-color: var(--status-critical);
          background: var(--status-critical-bg);
          color: var(--status-critical);
        }

        .np-login-divider {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .np-login-divider::before,
        .np-login-divider::after {
          content: '';
          flex: 1;
          border-top: 1px solid var(--np-line);
        }

        .np-login-oauth-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--space-3);
        }

        .np-login-side-stack {
          display: grid;
          gap: var(--space-4);
          align-content: start;
        }

        .np-login-security-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: var(--np-font-body);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--np-ink);
        }

        @media (max-width: 960px) {
          .np-login-headline-grid,
          .np-login-body-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .np-login-page {
            padding: 16px;
          }

          .np-login-oauth-grid {
            grid-template-columns: 1fr;
          }

          .np-login-options {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
