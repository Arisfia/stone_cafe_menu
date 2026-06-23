import { MenuItemDetail } from "@/components/menu/menu-item-detail";

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MenuItemDetail itemId={slug} />;
}
