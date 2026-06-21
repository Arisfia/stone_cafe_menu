import { MenuApp } from "@/components/menu/menu-app";

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MenuApp initialItemId={slug} />;
}
