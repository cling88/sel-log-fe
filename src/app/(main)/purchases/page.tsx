import { redirect } from "next/navigation";

export default function PurchasesRedirectPage() {
  redirect("/ledger?tab=purchase");
}
