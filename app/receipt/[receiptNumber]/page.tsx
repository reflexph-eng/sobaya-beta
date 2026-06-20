import { PublicReceiptView } from "@/components/receipts/public-receipt-view";

export default function ReceiptPage({ params }: { params: { receiptNumber: string } }) {
  return <PublicReceiptView receiptNumber={decodeURIComponent(params.receiptNumber)} />;
}
