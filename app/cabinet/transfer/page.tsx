import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { TransferForm } from "./TransferForm";

export default async function TransferPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  return <TransferForm />;
}
