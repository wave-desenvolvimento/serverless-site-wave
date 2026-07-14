import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

const PIPERUN_API = "https://api.pipe.run/v1";
const PIPERUN_TOKEN = process.env.PIPERUN_TOKEN!;

const formSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  site: z.string().optional().default(""),
  revenue: z.string().optional().default(""),
  message: z.string().optional().default(""),
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
  const res = await fetch(
    `${PIPERUN_API}/users?token=${PIPERUN_TOKEN}`
  );
  const data = await res.json();
  const user = data.data?.[0];
  if (!user) throw new Error("Nenhum usuário encontrado na conta Piperun.");
  return user.id;
}

async function getPipelineAndStage(): Promise<{
  pipelineId: number;
  stageId: number;
}> {
  const res = await fetch(
    `${PIPERUN_API}/pipelines?show=small&token=${PIPERUN_TOKEN}`
  );
  const data = await res.json();

  const pipeline = data.data?.find(
    (p: { name: string }) =>
      p.name.toLowerCase().includes("entrada") &&
      p.name.toLowerCase().includes("lead")
  );

  if (!pipeline) {
    throw new Error(
      "Funil 'Entrada de Leads' não encontrado na Piperun. Verifique o nome do funil."
    );
  }

  const stagesRes = await fetch(
    `${PIPERUN_API}/stages?pipeline_id=${pipeline.id}&show=small&token=${PIPERUN_TOKEN}`
  );
  const stagesData = await stagesRes.json();

  const firstStage = stagesData.data?.[0];
  if (!firstStage) {
    throw new Error("Nenhuma etapa encontrada no funil.");
  }

  return { pipelineId: pipeline.id, stageId: firstStage.id };
}

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

  const { name, phone, company, email, site, revenue, message } = parsed.data;

  try {
    // 1. Buscar owner e criar o contato (person)
    const ownerId = await getOwnerId();
    const person = await piperunFetch("/persons", {
      name,
      owner_id: ownerId,
      contact_emails: [{ email, is_main: true }],
      contact_phones: [{ phone, is_main: true }],
    });

    const personId = person.data?.id;
    if (!personId) throw new Error("Falha ao obter ID do contato criado.");

    // 2. Criar a empresa (organization) e vincular ao contato
    const org = await piperunFetch("/organizations", {
      name: company,
      ...(site && { website: site }),
    });

    const orgId = org.data?.id;

    // Vincular contato à empresa
    if (orgId) {
      await piperunFetch(`/persons/${personId}`, {
        organization_id: orgId,
      }).catch(() => {
        // não bloqueia se falhar
      });
    }

    // 3. Buscar funil e etapa
    const { pipelineId, stageId } = await getPipelineAndStage();

    // 4. Criar o deal (negócio)
    const dealTitle = `Lead - ${company} - ${name}`;
    const notes = [
      revenue && `Faturamento: ${revenue}`,
      site && `Site: ${site}`,
      message && `Mensagem: ${message}`,
    ]
      .filter(Boolean)
      .join("\n");

    await piperunFetch("/deals", {
      title: dealTitle,
      pipeline_id: pipelineId,
      stage_id: stageId,
      person_id: personId,
      ...(orgId && { organization_id: orgId }),
      ...(notes && { description: notes }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Webhook error:", errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
