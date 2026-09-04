import { test } from "node:test";
import assert from "node:assert/strict";
import { imageSourceForSite } from "../src/lib/blogs/types";

test("CRM previews keep canonical website images on the public website origin", () => {
  assert.equal(
    imageSourceForSite("https://www.harmonymedspafl.com/images/blogs/get-radiant-skin/1.jpg"),
    "https://www.harmonymedspafl.com/images/blogs/get-radiant-skin/1.jpg",
  );
  assert.equal(
    imageSourceForSite("https://harmonymedspafl.com/images/blogs/blog-1/2.jpg"),
    "https://www.harmonymedspafl.com/images/blogs/blog-1/2.jpg",
  );
});

test("CRM previews upgrade old Vercel image URLs without making them local", () => {
  assert.equal(
    imageSourceForSite("https://harmony-medspa.vercel.app/images/blogs/example.jpg?version=2"),
    "https://www.harmonymedspafl.com/images/blogs/example.jpg?version=2",
  );
  assert.equal(imageSourceForSite("/images/dashboard-only.jpg"), "/images/dashboard-only.jpg");
  assert.equal(
    imageSourceForSite("https://fcpqllxxplkmrbxayeuo.supabase.co/storage/v1/object/public/blog/example.jpg"),
    "https://fcpqllxxplkmrbxayeuo.supabase.co/storage/v1/object/public/blog/example.jpg",
  );
});
