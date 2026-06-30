import { QrDesigner, type QrPrintDesign } from "@/components/qr/qr-designer";

export default async function AdminQrPrintPage({
  searchParams
}: {
  searchParams: Promise<{ design?: string }>;
}) {
  const { design } = await searchParams;
  const printDesign: QrPrintDesign = design === "card" || design === "tent" ? design : "poster";
  return <QrDesigner printMode printDesign={printDesign} />;
}
