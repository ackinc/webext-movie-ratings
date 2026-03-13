import { test } from "node:test";
import * as assert from "node:assert";
import { getGeneralizedUrlPath, percentile } from "../utils/index.ts";

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

test("percentile", (t) => {
  t.test("does not accept empty arrays", () => {
    assert.throws(() => percentile([], 0));
    assert.throws(() => percentile([], 25));
    assert.throws(() => percentile([], 50));
    assert.throws(() => percentile([], 75));
    assert.throws(() => percentile([], 100));
  });

  t.test("does not accept pc outside [0, 100]", () => {
    assert.throws(() => percentile([1, 2, 3], -5));
    assert.throws(() => percentile([1, 2, 3], 105));
  });

  t.test("does not accept unsorted array", () => {
    assert.throws(() => percentile([2, 1], 50));
  });

  t.test("computes median correctly", () => {
    assert.equal(percentile([1], 50), 1);
    assert.equal(percentile([1, 2, 3], 50), 2);
    assert.equal(percentile([1, 2, 3, 4], 50), 2.5);
  });

  t.test("computes arbitrary percentiles correctly", () => {
    // even-length array
    const arr = new Array(100).fill(0).map((_n, idx) => idx + 1);
    assert.equal(percentile(arr, 25), 25.5);
    assert.equal(percentile(arr, 75), 75.5);
    assert.equal(percentile(arr, 95), 95.5);
    assert.equal(percentile(arr, 99), 99.5);

    // odd-length array
    arr.push(101);
    assert.equal(percentile(arr, 25), 26);
    assert.equal(percentile(arr, 75), 76);
    assert.equal(percentile(arr, 95), 96);
    assert.equal(percentile(arr, 99), 100);
  });
});
