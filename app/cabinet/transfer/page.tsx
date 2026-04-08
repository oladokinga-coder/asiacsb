import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { TransferForm } from "./TransferForm";

export default async function TransferPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  if (isSheetsConfigured()) {
    let sheet = null;
    try {
      sheet = await getClientFromSheet(userId);
    } catch (e) {
      console.error(e);
    }
    if (!sheet || !sheet.transferAllowed || sheet.cardDetailsHidden) {
      redirect("/cabinet");
    }
  }

  return <TransferForm />;
}
