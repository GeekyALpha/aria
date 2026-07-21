import "server-only";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { agentActionSchema, fallbackAction, type AgentAction } from "./schemas";
import { SYSTEM_PROMPT, type DecideInput } from "./prompt";

export interface DecideResult {
  action: AgentAction;
  model: string;
  fallback: boolean;
}

export async function decideAction(input: DecideInput): Promise<DecideResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      action: fallbackAction(input.invoice.amount_cents, input.invoice.debtor_name),
      model: "fallback",
      fallback: true,
    };
  }

  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.parse({
      model: "gpt-4o",
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            "Decide the next AR action. Debtor + invoice context (JSON):\n" +
            JSON.stringify(input, null, 2),
        },
      ],
      response_format: zodResponseFormat(agentActionSchema, "agent_action"),
    });

    const parsed = res.choices[0]?.message.parsed;
    if (!parsed) {
      return {
        action: fallbackAction(input.invoice.amount_cents, input.invoice.debtor_name),
        model: "gpt-4o",
        fallback: true,
      };
    }
    return { action: parsed, model: "gpt-4o", fallback: false };
  } catch (err) {
    console.error("[agent] decideAction failed, using fallback:", err);
    return {
      action: fallbackAction(input.invoice.amount_cents, input.invoice.debtor_name),
      model: "fallback",
      fallback: true,
    };
  }
}
