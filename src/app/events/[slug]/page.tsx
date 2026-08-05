import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EventArticlePage({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/archive/events/${slug}`);
}
