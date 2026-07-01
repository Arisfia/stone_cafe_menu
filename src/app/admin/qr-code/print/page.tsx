import { QrDesigner, type QrPrintVariant } from "@/components/qr/qr-designer";

export default async function AdminQrPrintPage({
  searchParams
}: {
  searchParams: Promise<{ mode?: string; tables?: string }>;
}) {
  const { mode, tables } = await searchParams;
  const variant: QrPrintVariant = mode === "qr" ? "qr" : "design";
  const parsed = (tables ?? "1")
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 200);
  const tableLabels = parsed.length ? parsed : ["1"];
  return <QrDesigner printMode printVariant={variant} tableLabels={tableLabels} />;
}
