import { test } from "node:test";
import * as assert from "node:assert";
import { getGeneralizedUrlPath } from "../utils/index.ts";

test("getGeneralizeUrlPath", (t) => {
  t.test("should replace numbers in path segments with :n", () => {
    assert.strictEqual(
      getGeneralizedUrlPath("/genres/123/movies/456"),
      "/genres/:n/movies/:n",
    );
  });

  t.test("doesn't mind trailing slashes in url path", () => {
    assert.strictEqual(
      getGeneralizedUrlPath("/genres/123/movies/456/"),
      "/genres/:n/movies/:n/",
    );
  });

  t.test("leaves generic paths untouched", () => {
    assert.strictEqual(getGeneralizedUrlPath("/"), "/");
    assert.strictEqual(getGeneralizedUrlPath("/a/b/c"), "/a/b/c");
  });

  t.test("replaces values in search params too", () => {
    assert.strictEqual(
      getGeneralizedUrlPath("/genres/123/movies/456?h=0a1b2c&w=7a8b9c"),
      "/genres/:n/movies/:n?h=:n&w=:n",
    );
  });

  t.test("makes order of search params irrelevant", () => {
    assert.strictEqual(
      getGeneralizedUrlPath("/genres/123/movies/456?h=0a1b2c&w=7a8b9c"),
      getGeneralizedUrlPath("/genres/123/movies/456?w=7a8b9c&h=0a1b2c"),
    );
  });
});
