import { prisma } from "@/lib/prisma";
import { OceanHome } from "@/modules/home/components/ocean-home";
import {
  findRecentMilestones,
  isMissingMilestonesTable,
} from "@/modules/milestones/server/milestone-service";
import { generateExcerpt } from "@/modules/posts/post-text";
import type { HomePost, OceanHomeData } from "@/modules/home/home.types";

export const revalidate = 300;

const EMPTY_HOME_DATA: OceanHomeData = {
  featuredPosts: [],
  newsPosts: [],
  milestones: [],
  knowledgeCategories: [],
  competitionCategories: [],
  photos: [],
  notes: [],
  members: [],
  totals: { posts: 0, categories: 0, members: 0 },
};

function serializePost(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string; type: string } | null;
}): HomePost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    categoryName: post.category?.name ?? null,
    categorySlug: post.category?.slug ?? null,
    categoryType: post.category?.type ?? null,
  };
}

async function getHomepageMilestones() {
  try {
    return await findRecentMilestones(7);
  } catch (error) {
    if (isMissingMilestonesTable(error)) return [];
    throw error;
  }
}

async function getHomeData(): Promise<OceanHomeData> {
  const [
    featuredPosts,
    newsPosts,
    milestones,
    knowledgeCategories,
    competitionCategories,
    photos,
    notes,
    members,
    postCount,
    categoryCount,
    memberCount,
  ] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
        category: { select: { name: true, slug: true, type: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED", category: { type: "NEWS" } },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        publishedAt: true,
        author: { select: { displayName: true, username: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    getHomepageMilestones(),
    prisma.category.findMany({
      where: { type: "KNOWLEDGE" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.category.findMany({
      where: { type: "COMPETITION" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.photo.findMany({
      select: { id: true, imagePath: true, caption: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.stickyNote.findMany({
      select: {
        id: true,
        content: true,
        isAnonymous: true,
        author: { select: { displayName: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      select: {
        id: true,
        username: true,
        displayName: true,
        profile: { select: { title: true } },
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.category.count(),
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
  ]);

  return {
    featuredPosts: featuredPosts.map(serializePost),
    newsPosts: newsPosts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? generateExcerpt(post.content, 360),
      publishedAt: post.publishedAt?.toISOString() ?? null,
      authorName: post.author.displayName ?? post.author.username,
    })),
    milestones: milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      occurredAt: milestone.occurredAt.toISOString(),
    })),
    knowledgeCategories: knowledgeCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: category._count.posts,
    })),
    competitionCategories: competitionCategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      count: category._count.posts,
    })),
    photos,
    notes: notes.map((note) => ({
      id: note.id,
      content: note.content,
      authorName: note.isAnonymous ? "匿名" : (note.author.displayName ?? note.author.username),
    })),
    members: members.map((member) => ({
      id: member.id,
      username: member.username,
      name: member.displayName ?? member.username,
      title: member.profile?.title ?? "科协成员",
      postCount: member._count.posts,
    })),
    totals: { posts: postCount, categories: categoryCount, members: memberCount },
  };
}

export default async function Home() {
  let data: OceanHomeData;

  try {
    data = await getHomeData();
  } catch (error) {
    console.error("Failed to load homepage content; rendering the visual fallback.", error);
    data = EMPTY_HOME_DATA;
  }

  return <OceanHome data={data} />;
}
