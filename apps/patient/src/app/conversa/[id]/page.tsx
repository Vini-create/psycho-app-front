import { redirect } from "next/navigation";

/** Compatibilidade com links antigos: o chat agora vive em um único workspace. */
export default async function LegacyConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/chat?c=${encodeURIComponent(id)}`);
}
