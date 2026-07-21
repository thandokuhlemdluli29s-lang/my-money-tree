import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ChatInputSchema = z.object({
  messages: z.array(MessageSchema),
});

export const chatWithBudgetBot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(ChatInputSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch the user's recent transactions for context (last 100)
    const { data: txs, error: txError } = await supabase
      .from("transactions")
      .select("type, amount, category, note, occurred_on")
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false })
      .limit(100);

    if (txError) {
      throw new Error(`Failed to load transactions: ${txError.message}`);
    }

    // Build a compact summary for the system prompt
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const categoryTotals: Record<string, number> = {};

    for (const t of txs ?? []) {
      if (t.occurred_on >= monthStart) {
        if (t.type === "income") monthlyIncome += Number(t.amount);
        else {
          monthlyExpense += Number(t.amount);
          categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + Number(t.amount);
        }
      }
    }

    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: R${amt.toFixed(2)}`)
      .join(", ");

    const recentList = (txs ?? [])
      .slice(0, 10)
      .map(
        (t) =>
          `${t.occurred_on} | ${t.type === "income" ? "+" : "-"}R${Number(t.amount).toFixed(2)} | ${t.category}${t.note ? ` (${t.note})` : ""}`,
      )
      .join("\n");

    const systemPrompt = `You are Budgetly Bot, a friendly and knowledgeable personal finance assistant built into the Budgetly app. You help users understand their spending, identify saving opportunities, and make smarter financial decisions.

Here is the user's current financial snapshot:

=== THIS MONTH (${now.toLocaleString("default", { month: "long", year: "numeric" })}) ===
- Total Income: R${monthlyIncome.toFixed(2)}
- Total Expenses: R${monthlyExpense.toFixed(2)}
- Net Balance: R${(monthlyIncome - monthlyExpense).toFixed(2)}
- Top expense categories: ${topCategories || "No expenses yet"}

=== 10 MOST RECENT TRANSACTIONS ===
${recentList || "No transactions yet"}

=== INSTRUCTIONS ===
- Answer questions about the user's budget, spending patterns, and financial health using the data above.
- Give practical, actionable advice tailored to their actual numbers.
- Be concise but warm. Use South African Rand (R / ZAR) for all amounts.
- If asked something outside personal finance, politely redirect to budgeting topics.
- Do NOT make up transactions or amounts not shown above.`;

    const OPENAI_API_BASE = process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1";
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [{ role: "system", content: systemPrompt }, ...data.messages],
        max_completion_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errText}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const reply =
      json.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response. Please try again.";
    return { reply };
  });
