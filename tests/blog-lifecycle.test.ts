import { test } from "node:test";
import assert from "node:assert/strict";
import { blogTransitionError, canTransitionBlog, parseBlogStatus } from "../src/lib/blogs/lifecycle";

test("Archived is a recognised blog status and unknown values fall back to Draft", () => {
  assert.equal(parseBlogStatus("Archived"), "Archived");
  assert.equal(parseBlogStatus("Published"), "Published");
  assert.equal(parseBlogStatus("Retired"), "Draft");
  assert.equal(parseBlogStatus(undefined), "Draft");
});

test("published articles never move back to draft", () => {
  assert.equal(canTransitionBlog("Published", "Draft"), false);
  assert.match(blogTransitionError("Published", "Draft") || "", /Archive/);
  assert.equal(canTransitionBlog("Archived", "Draft"), false);
});

test("archive and restore are the only ways in and out of Archived", () => {
  assert.equal(canTransitionBlog("Published", "Archived"), true);
  assert.equal(canTransitionBlog("Archived", "Published"), true);
  assert.equal(canTransitionBlog("Draft", "Archived"), false);
  assert.equal(canTransitionBlog("Draft", "Published"), true);
  assert.equal(blogTransitionError("Published", "Published"), null);
});

