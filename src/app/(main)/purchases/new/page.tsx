import { redirect } from "next/navigation";

export default function PurchaseNewRedirectPage() {
  redirect("/ledger?tab=purchase");
}
