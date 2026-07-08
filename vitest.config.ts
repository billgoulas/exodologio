import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      // Dummy secret so modules that derive keys from JWT_SECRET (e.g.
      // server/_core/crypto.ts) can load during tests without needing a real
      // production secret. Never used to protect real data.
      JWT_SECRET: "test-secret-not-for-production",
    },
  },
});
