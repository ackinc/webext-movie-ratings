import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  build: {
    format: "directory",
  },
  integrations: [react()],
});
