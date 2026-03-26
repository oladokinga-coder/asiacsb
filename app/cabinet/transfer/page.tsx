import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { TransferForm } from "./TransferForm";

export default async function TransferPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  if (isSheetsConfigured()) {
    const sheet = await getClientFromSheet(userId);
    if (!sheet || !sheet.transferAllowed || sheet.cardDetailsHidden) {
      redirect("/cabinet");
    }
  }

  return <TransferForm />;
}
