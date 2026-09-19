import assert from "node:assert/strict";
import test from "node:test";
import { youtubeVideoId } from "../client/src/video-source.mjs";

test("extracts supported YouTube URL formats", () => {
  assert.equal(youtubeVideoId("https://www.youtube.com/watch?v=4v2BUjLSmKw"), "4v2BUjLSmKw");
  assert.equal(youtubeVideoId("https://youtu.be/4v2BUjLSmKw?t=2"), "4v2BUjLSmKw");
  assert.equal(youtubeVideoId("https://youtube.com/shorts/4v2BUjLSmKw"), "4v2BUjLSmKw");
  assert.equal(youtubeVideoId("https://example.com/movie.mp4"), null);
});
