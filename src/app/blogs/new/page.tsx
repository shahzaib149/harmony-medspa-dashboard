import DashboardLayout from "@/components/layout/DashboardLayout";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import BlogEditor from "../BlogEditor";

export default async function NewBlogPage() {
  await requirePageAuth({ minimumRole: "editor", next: "/blogs/new" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  return (
    <DashboardLayout title="New blog article" subtitle="Write the content manually; technical SEO is prepared for you.">
      <BlogEditor mode="new" canEdit siteUrl={siteUrl} />
    </DashboardLayout>
  );
}
