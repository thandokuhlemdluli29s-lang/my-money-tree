import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, TrendingUp, PieChart, Wallet, Sparkles, MessageCircle, Mail, MapPin } from "lucide-react";
import { SupportChatBot } from "@/components/SupportChatBot";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setChecking(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Budgetly</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="#contact" className="hidden rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted sm:inline-flex">
            Contact
          </a>
          {!checking && signedIn ? (
            <button
              onClick={() => navigate({ to: "/dashboard" })}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Open dashboard
            </button>
          ) : (
            <>
              <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                Sign in
              </Link>
              <Link
                to="/auth"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Simple. Smart. Yours.
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
              Take control of<br />
              <span className="text-primary">every dollar</span>.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Track income and expenses in seconds. See where your money goes and build habits that stick.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={signedIn ? "/dashboard" : "/auth"}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
              >
                {signedIn ? "Open dashboard" : "Start free"} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#features" className="inline-flex items-center rounded-full border border-input px-6 py-3 text-sm font-medium hover:bg-muted">
                Learn more
              </a>
            </div>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/20 to-primary/5 blur-2xl" />
            <div className="relative rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">This month</p>
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">+12%</span>
              </div>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">R 42,708.20</p>
              <p className="text-sm text-muted-foreground">Remaining balance</p>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Groceries", amount: "−R 1,263.00", tint: "bg-primary/10 text-primary" },
                  { label: "Salary", amount: "+R 48,000.00", tint: "bg-success/15 text-success" },
                  { label: "Coffee", amount: "−R 42.50", tint: "bg-accent/25 text-accent-foreground" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${r.tint} text-xs font-bold`}>
                        {r.label[0]}
                      </span>
                      <span className="text-sm font-medium">{r.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{r.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: TrendingUp, title: "Log in seconds", body: "Add income and expenses with categories that make sense to you." },
            { icon: PieChart, title: "See the whole picture", body: "Monthly totals and category breakdowns tell you where money goes." },
            { icon: Wallet, title: "Save more, stress less", body: "Simple summaries help you make smart choices every day." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact / Support */}
      <section id="contact" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-3xl border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Need help?
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
                We're here for you.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Running into a problem or have a question about your budget? Reach out to our team
                and we'll get back to you as soon as possible.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">CEO:</span> Thandokuhle Mdluli
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="https://wa.me/27663725168"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-4 rounded-2xl border bg-background px-4 py-3 transition hover:border-primary hover:bg-muted/50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">WhatsApp</p>
                  <p className="font-semibold">066 372 5168</p>
                </div>
              </a>

              <a
                href="mailto:thandokuhle.mdluli29s@gmail.com"
                className="flex items-center gap-4 rounded-2xl border bg-background px-4 py-3 transition hover:border-primary hover:bg-muted/50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="truncate font-semibold">thandokuhle.mdluli29s@gmail.com</p>
                </div>
              </a>

              <div className="flex items-start gap-4 rounded-2xl border bg-background px-4 py-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/25 text-accent-foreground">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Branch</p>
                  <p className="font-semibold leading-snug">
                    Marikana Ext 3, Building T0859<br />
                    Kwa-Thema, Springs<br />
                    Johannesburg, Gauteng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Budgetly — Smart Budget Tracker.</span>
          <span>Kwa-Thema, Springs • Gauteng, South Africa</span>
        </div>
      </footer>
    </div>
  );
}
