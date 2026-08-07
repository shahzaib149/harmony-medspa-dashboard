import DashboardLayout from "@/components/layout/DashboardLayout";
import { hasMinimumRole } from "@/lib/auth/permissions";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import BlogEditor from "../BlogEditor";

export default async function EditBlogPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  const { profile } = await requirePageAuth({ next: `/blogs/${recordId}` });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  return (
    <DashboardLayout title="Edit blog article" subtitle="Update the article and review its technical SEO package.">
      <BlogEditor mode="edit" recordId={recordId} canEdit={hasMinimumRole(profile.role, "editor")} siteUrl={siteUrl} />
    </DashboardLayout>
  );
}
