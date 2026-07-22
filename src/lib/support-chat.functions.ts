import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const SupportChatInputSchema = z.object({
  messages: z.array(MessageSchema),
});

export const supportChat = createServerFn({ method: "POST" })
  .validator(SupportChatInputSchema)
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const systemPrompt = `You are Budgetly Support Bot, a friendly virtual assistant for the Budgetly app (a Smart Budget Tracker). You provide assistance during off hours when the human team is unavailable.

=== ABOUT BUDGETLY ===
Budgetly helps South African users track income and expenses, set monthly budgets, view spending charts, and reach savings goals. All amounts are in South African Rand (ZAR / R).

=== COMPANY CONTACT INFO ===
- CEO: Thandokuhle Mdluli
- WhatsApp: 066 372 5168 (https://wa.me/27663725168)
- Email: thandokuhle.mdluli29s@gmail.com
- Branch: Marikana Ext 3, Building T0859, Kwa-Thema, Springs, Johannesburg, Gauteng
- Support hours: Weekdays 08:00–17:00 SAST. Outside those hours, share the contact details above and let the user know the team will respond as soon as possible.

=== INSTRUCTIONS ===
- Greet warmly and be concise.
- Help with common questions: how to sign up, add transactions, categories, budgets, ZAR formatting, forgotten password (they can reset via the sign-in page), account issues.
- If a question is outside your scope or requires human help, share the WhatsApp/email above and reassure them the team will reply during working hours.
- Never invent features that don't exist. Never share sensitive info.
- Use South African Rand (R) for any money examples.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        messages: [{ role: "system", content: systemPrompt }, ...data.messages],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        return {
          reply:
            "I'm receiving a lot of requests right now. Please try again in a moment, or reach us on WhatsApp: 066 372 5168.",
        };
      }
      if (response.status === 402) {
        return {
          reply:
            "Our AI assistant is temporarily unavailable. Please contact us on WhatsApp 066 372 5168 or email thandokuhle.mdluli29s@gmail.com.",
        };
      }
      throw new Error(`AI Gateway error ${response.status}: ${errText}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const reply =
      json.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response. Please try again or reach us on WhatsApp: 066 372 5168.";
    return { reply };
  });
