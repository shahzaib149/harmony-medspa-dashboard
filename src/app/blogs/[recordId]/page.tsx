import DashboardLayout from "@/components/layout/DashboardLayout";
import { getBlog } from "@/lib/airtable/blogs";
import { hasMinimumRole } from "@/lib/auth/permissions";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import BlogPreview from "../BlogPreview";

export const dynamic = "force-dynamic";

export default async function BlogPreviewPage({ params }: { params: Promise<{ recordId: string }> }) {
  const { recordId } = await params;
  const { profile } = await requirePageAuth({ next: `/blogs/${recordId}` });
  const blog = await getBlog(recordId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

  return (
    <DashboardLayout
      title="Blog preview"
      subtitle="Review the article inside the dashboard before editing or opening the published page."
    >
      <BlogPreview
        blog={blog}
        canEdit={hasMinimumRole(profile.role, "editor")}
        siteUrl={siteUrl}
      />
    </DashboardLayout>
  );
}
