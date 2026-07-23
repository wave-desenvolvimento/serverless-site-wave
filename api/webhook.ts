import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const PIPERUN_API = "https://api.pipe.run/v1";
const PIPERUN_TOKEN = process.env.PIPERUN_TOKEN!;
const RD_API_KEY = process.env.RD_STATION_API_KEY;

const formSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  company: z.string().min(1),
  site: z.string().optional().default(""),
  revenue: z.string().min(1),
  platform: z.string().min(1),
  role: z.string().min(1),
  employees: z.string().min(1),
  source: z.string().min(1),
  message: z.string().optional().default(""),
  newsletter: z.enum(["Sim", "Não"]).optional().default("Não"),
});

async function piperunFetch(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(
    `${PIPERUN_API}${endpoint}?show=small&token=${PIPERUN_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Piperun ${endpoint} falhou (${res.status}): ${text}`);
  }

  return res.json();
}

async function getOwnerId(): Promise<number> {
  const res = await fetch(`${PIPERUN_API}/users?token=${PIPERUN_TOKEN}`);
  const data = await res.json();
  const user = data?.data?.[0];
  if (!user) throw new Error("Nenhum usuário encontrado na conta Piperun.");
  return user.id;
}

const ORIGIN_MAP: Record<string, number> = {
  "Indicação": 339202,
  "Instagram": 268178,
  "LinkedIn": 268175,
  "Google": 442480,
  "Outro": 349932,
};

const PIPELINE_ID = 33184; // Funil de vendas Inbound
const STAGE_ID = 180708; // Entrada de Leads

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!PIPERUN_TOKEN) {
    return res.status(500).json({ error: "PIPERUN_TOKEN não configurado" });
  }

  const parsed = formSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Dados inválidos", details: parsed.error.flatten() });
  }

  const { name, email, phone, company, site, revenue, platform, role, employees, source, message, newsletter } = parsed.data;

  try {
    // 1. Buscar owner
    const ownerId = await getOwnerId();
    const originId = ORIGIN_MAP[source] ?? null;

    // 2. Criar o contato (person)
    const person = await piperunFetch("/persons", {
      name,
      owner_id: ownerId,
      job_title: role,
      ...(site && { website: site }),
      contact_emails: [{ email, is_main: true }],
      contact_phones: [{ phone, is_main: true }],
    });

    const personId = person.data?.id;
    if (!personId) throw new Error("Falha ao obter ID do contato criado.");

    // 3. Criar a empresa (organization) e vincular ao contato
    const org = await piperunFetch("/companies", {
      name: company,
      size: employees,
      ...(site && { website: site }),
    });

    const orgId = org.data?.id;

    // Vincular contato à empresa
    if (orgId) {
      await piperunFetch(`/persons/${personId}`, {
        company_id: orgId,
      }).catch(() => {
        // não bloqueia se falhar
      });
    }

    // 4. Criar o deal (negócio)
    const dealTitle = `${company}`;
    const noteLines = [
      `Faturamento: ${revenue}`,
      `Plataforma: ${platform}`,
      `Newsletter: ${newsletter}`,
      message && `Mensagem: ${message}`,
    ].filter(Boolean);
    const notes = noteLines.join("\n");

    await piperunFetch("/deals", {
      title: dealTitle,
      pipeline_id: PIPELINE_ID,
      stage_id: STAGE_ID,
      person_id: personId,
      ...(orgId && { company_id: orgId }),
      ...(originId && { origin_id: originId }),
      ...(notes && { description: notes }),
    });

    // 4. Se optou por newsletter, envia pra RD Station
    if (newsletter === "Sim" && RD_API_KEY) {
      await fetch(`https://api.rd.services/platform/conversions?api_key=${RD_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "CONVERSION",
          event_family: "CDP",
          payload: {
            conversion_identifier: "formulario-contato",
            name,
            email,
            available_for_mailing: true,
            traffic_source: "site",
          },
        }),
      }).catch(() => {
        // não bloqueia o fluxo se RD falhar
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Webhook error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
