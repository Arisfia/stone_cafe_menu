import { QrDesigner, type QrPrintVariant } from "@/components/qr/qr-designer";

export default async function AdminQrPrintPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; count?: string }>;
}) {
  const { mode, count } = await searchParams;
  const variant: QrPrintVariant = mode === "qr" ? "qr" : "design";
  const tableCount = Math.min(Math.max(parseInt(count ?? "1", 10) || 1, 1), 200);
  return <QrDesigner printMode printVariant={variant} tableCount={tableCount} />;
}
