export type Status =
  "draft" | "review" | "needs_verification" | "published" | "archived";
export type Shot = {
  id: string;
  path: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  reviewed: boolean;
};
export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  device: string;
  manufacturer: string;
  os: string;
  category: string;
  tags: string[];
  symptoms: string;
  error_message: string;
  cause: string;
  steps: string;
  commands: string;
  warnings: string;
  verification: string;
  alternatives: string;
  faq: { question: string; answer: string }[];
  related_ids: string[];
  screenshots: Shot[];
  seo_title: string;
  seo_description: string;
  status: Status;
  verified: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  views: number;
  likes: number;
  comment_count: number;
};
export type PostSummary = Pick<
  Post,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "device"
  | "category"
  | "status"
  | "published_at"
  | "views"
  | "likes"
>;
export type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  name: string;
  body: string;
  status: string;
  is_admin: boolean;
  created_at: string;
};
export type Settings = {
  brand: string;
  support_url: string;
  whatsapp: string;
  email: string;
  booking_url: string;
  admin_label: string;
  description: string;
};
export const categories = [
  "Windows",
  "Storage & recovery",
  "BIOS & boot",
  "Drivers & Wi-Fi",
  "Linux",
  "macOS",
  "Hardware",
  "Development",
];
export const blankPost: Omit<
  Post,
  "id" | "created_at" | "updated_at" | "views" | "likes" | "comment_count"
> = {
  title: "",
  slug: "",
  excerpt: "",
  device: "",
  manufacturer: "",
  os: "",
  category: "Windows",
  tags: [],
  symptoms: "",
  error_message: "",
  cause: "",
  steps: "",
  commands: "",
  warnings: "",
  verification: "",
  alternatives: "",
  faq: [],
  related_ids: [],
  screenshots: [],
  seo_title: "",
  seo_description: "",
  status: "draft",
  verified: false,
  published_at: null,
};
