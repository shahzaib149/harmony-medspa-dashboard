import Link from "next/link";
import { Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { hasMinimumRole } from "@/lib/auth/permissions";
import { requirePageAuth } from "@/lib/auth/require-page-auth";
import BlogsClient from "./BlogsClient";

export default async function BlogsPage() {
  const { profile } = await requirePageAuth({ next: "/blogs" });
  const canManage = hasMinimumRole(profile.role, "editor");
  return (
    <DashboardLayout
      title="Blog editorial"
      subtitle="Plan, write, optimize, and publish every Harmony article from one workspace."
      actions={canManage ? (
        <Link
          href="/blogs/new"
          className="blog-header-action"
        >
          <Plus size={17} />
          <span className="hidden sm:inline">New article</span>
          <span className="sm:hidden">New</span>
        </Link>
      ) : undefined}
    >
      <BlogsClient canManage={canManage} />
    </DashboardLayout>
  );
}
