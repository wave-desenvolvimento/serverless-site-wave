import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const RD_API = "https://api.rd.services/platform/conversions";
const RD_API_KEY = process.env.RD_STATION_API_KEY!;

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!RD_API_KEY) {
    return res.status(500).json({ error: "RD_STATION_API_KEY não configurado" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }

  const { name, email } = parsed.data;

  try {
    const response = await fetch(`${RD_API}?api_key=${RD_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "CONVERSION",
        event_family: "CDP",
        payload: {
          conversion_identifier: "newsletter-site",
          name,
          email,
          available_for_mailing: true,
          traffic_source: "site",
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RD Station falhou (${response.status}): ${text}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido";
    console.error("RD Newsletter error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
