import { notFound } from "next/navigation";

import ReadView from "@/components/ReadView";
import { READS, findRead } from "@/lib/reads";

/* 정적 내보내기라 글마다 페이지를 미리 만든다. */
export function generateStaticParams() {
  return READS.map((read) => ({ slug: read.slug }));
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const read = findRead(slug);
  if (!read) notFound();
  return <ReadView slug={read.slug} />;
}
