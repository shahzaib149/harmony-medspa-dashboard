import { BLOG_STATUSES, type BlogStatus } from "@/lib/blogs/types";

// Published articles never drop back to Draft: they are archived (hidden from
// the website, kept in the dashboard) or deleted. Archived articles return by
// republishing at the same URL.
const ALLOWED_TRANSITIONS: Record<BlogStatus, BlogStatus[]> = {
  Draft: ["Published"],
  Published: ["Archived"],
  Archived: ["Published"],
};

export function parseBlogStatus(value: unknown): BlogStatus {
  return BLOG_STATUSES.includes(value as BlogStatus) ? value as BlogStatus : "Draft";
}

export function canTransitionBlog(from: BlogStatus, to: BlogStatus) {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

export function blogTransitionError(from: BlogStatus, to: BlogStatus) {
  if (canTransitionBlog(from, to)) return null;
  if (from === "Published" && to === "Draft") {
    return "Published articles cannot move back to draft. Archive the article to take it off the website, or delete it.";
  }
  if (from === "Archived" && to === "Draft") {
    return "Archived articles cannot move back to draft. Restore the article to republish it, or delete it.";
  }
  if (to === "Archived") return "Only published articles can be archived. Delete the draft instead.";
  return `An article cannot move from ${from} to ${to}.`;
}
