import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    poolOptions: {
      forks: { execArgv: ["--experimental-eventsource"] },
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/researcher/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});
