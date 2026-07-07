import { LoginForm } from '@/components/auth/LoginForm';

const FEATURES = [
  'Lead & Customer Management',
  'Deal Pipeline & Forecasting',
  'Email Campaigns & Automation',
  'Team Tasks & Collaboration',
  'Invoices, Quotes & Payments',
  'Reports & Analytics',
];

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Left branding panel ── */}
      <div className="relative hidden lg:flex lg:w-[44%] flex-col justify-between overflow-hidden bg-slate-950 p-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-blue-800/20 blur-3xl" />
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.04) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <span className="text-sm font-bold text-white">SP</span>
          </div>
          <span className="text-lg font-semibold text-white">SalesPilot CRM</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Drive sales.<br />
              Close deals.<br />
              <span className="text-blue-400">Grow faster.</span>
            </h1>
            <p className="max-w-xs text-base text-slate-400">
              Everything your sales team needs, in one powerful desktop app.
            </p>
          </div>

          <ul className="space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden>
                    <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-600">
          <span>Built by SuperSoft Ltd</span>
          <span>v4.0</span>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-xs font-bold text-white">SP</span>
            </div>
            <span className="font-semibold text-slate-900">SalesPilot CRM</span>
          </div>

          <LoginForm />
        </div>

        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} SuperSoft Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
