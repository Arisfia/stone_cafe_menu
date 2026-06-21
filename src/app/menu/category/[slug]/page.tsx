import { MenuApp } from "@/components/menu/menu-app";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MenuApp initialCategorySlug={slug} />;
}
