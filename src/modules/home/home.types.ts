export type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type HomePost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  categoryType: string | null;
};

export type HomeNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string | null;
  authorName: string;
};

export type HomeMilestone = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
};

export type HomeActivityPoint = {
  key: string;
  label: string;
  count: number;
};

export type HomeSectionStat = {
  type: string;
  label: string;
  categories: number;
  posts: number;
};

export type HomeSiteActivity = {
  totalPosts: number;
  totalCategories: number;
  totalMembers: number;
  totalViews: number;
  sections: HomeSectionStat[];
  series: {
    week: HomeActivityPoint[];
    month: HomeActivityPoint[];
    year: HomeActivityPoint[];
  };
};

export type HomePhoto = {
  id: string;
  imagePath: string;
  caption: string | null;
};

export type HomeNote = {
  id: string;
  content: string;
  authorName: string;
  color: string;
};

export type HomeMember = {
  id: string;
  username: string;
  name: string;
  title: string;
  avatar: string | null;
  bio: string | null;
  postCount: number;
};

export type OceanHomeData = {
  featuredPosts: HomePost[];
  newsPosts: HomeNews[];
  milestones: HomeMilestone[];
  knowledgeCategories: HomeCategory[];
  competitionCategories: HomeCategory[];
  photos: HomePhoto[];
  notes: HomeNote[];
  members: HomeMember[];
  siteActivity: HomeSiteActivity;
  totals: {
    posts: number;
    categories: number;
    members: number;
  };
};
