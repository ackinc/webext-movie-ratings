import { test } from "node:test";
import * as assert from "node:assert";
import { standardizeUrlPath } from "../src/common/utils.ts";

test("standardizeUrlPath", (t) => {
  t.test("should replace numbers in path segments with :n", () => {
    assert.strictEqual(
      standardizeUrlPath("/genres/123/movies/456"),
      "/genres/:n/movies/:n",
    );
  });

  t.test("handles trailing slashes in url path", () => {
    assert.strictEqual(
      standardizeUrlPath("/genres/123/movies/456/"),
      "/genres/:n/movies/:n/",
    );
  });

  t.test("leaves generic paths untouched", () => {
    assert.strictEqual(standardizeUrlPath("/"), "/");
    assert.strictEqual(standardizeUrlPath("/a/b/c"), "/a/b/c");
  });

  t.test("replaces numbers in search params too", () => {
    assert.strictEqual(
      standardizeUrlPath("/genres/123/movies/456?w=789&h=012"),
      "/genres/:n/movies/:n?w=:n&h=:n",
    );
  });
});
