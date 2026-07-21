import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wallet, LogOut, Plus, TrendingUp, TrendingDown, Trash2, Loader2, Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Tx = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string | null;
  occurred_on: string;
  created_at: string;
};

const EXPENSE_CATEGORIES = ["Groceries", "Food & Drink", "Transport", "Housing", "Bills", "Shopping", "Health", "Entertainment", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Gift", "Investment", "Other"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);
}

function Dashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>("");
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // form
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCategory(type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }, [type]);

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    setUserEmail(u.user?.email ?? "");
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setTxs((data ?? []).map((t) => ({ ...t, amount: Number(t.amount) })) as Tx[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    let income = 0, expense = 0;
    for (const t of txs) {
      if (t.occurred_on < monthStart) continue;
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, balance: income - expense };
  }, [txs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return txs;
    return txs.filter(
      (t) => t.category.toLowerCase().includes(q) || (t.note ?? "").toLowerCase().includes(q),
    );
  }, [txs, search]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("transactions").insert({
      user_id: u.user.id,
      type,
      amount: amt,
      category,
      note: note || null,
      occurred_on: occurredOn,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Added");
    setOpen(false);
    setAmount(""); setNote("");
    load();
  };

  const onDelete = async (id: string) => {
    const prev = txs;
    setTxs((t) => t.filter((x) => x.id !== id));
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); setTxs(prev); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold">Budgetly</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-sm hover:bg-muted">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Summary */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)] md:col-span-3">
            <p className="text-sm font-medium text-muted-foreground">Balance this month</p>
            <p className={`mt-1 text-4xl font-extrabold tracking-tight ${totals.balance >= 0 ? "text-foreground" : "text-destructive"}`}>
              {fmt(totals.balance)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-success/10 p-4">
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Income</span>
                </div>
                <p className="mt-1 text-xl font-bold">{fmt(totals.income)}</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Expenses</span>
                </div>
                <p className="mt-1 text-xl font-bold">{fmt(totals.expense)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search transactions"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-input bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add transaction
          </button>
        </section>

        {/* List */}
        <section className="mt-6 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
              <p className="text-lg font-semibold">No transactions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Add your first income or expense to get started.</p>
              <button
                onClick={() => setOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Plus className="h-4 w-4" /> Add transaction
              </button>
            </div>
          ) : (
            filtered.map((t) => (
              <div key={t.id} className="group flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-[var(--shadow-soft)]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.type === "income" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"}`}>
                    {t.type === "income" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.category}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(t.occurred_on).toLocaleDateString()} {t.note ? `• ${t.note}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${t.type === "income" ? "text-success" : "text-foreground"}`}>
                    {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                  </span>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="rounded-full p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-extrabold">Add transaction</h2>
            <form onSubmit={onAdd} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
                {(["expense", "income"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setType(v)}
                    className={`rounded-full py-2 text-sm font-semibold capitalize transition ${
                      type === v ? "bg-card text-foreground shadow" : "text-muted-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Amount</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-input bg-background py-3 pl-9 pr-4 text-2xl font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                  {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={occurredOn}
                    onChange={(e) => setOccurredOn(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Coffee with Sam"
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-input py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
