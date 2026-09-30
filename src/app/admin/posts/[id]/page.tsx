import { notFound } from "next/navigation";
import { adminPage } from "@/lib/supabase";
import { Editor } from "@/components/editor";
import type { Post } from "@/lib/types";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await adminPage();
  if (!admin) return null;
  const { id } = await params,
    { db } = admin;
  const { data: options } = await db
    .from("posts")
    .select("id,title")
    .order("title")
    .limit(1000);
  if (id === "new")
    return (
      <>
        <h1>Add a problem</h1>
        <Editor key="new" options={options || []} />
      </>
    );
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();
  return (
    <>
      <h1>Edit problem</h1>
      <Editor key={data.id} initial={data as Post} options={options || []} />
    </>
  );
}
