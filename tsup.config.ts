import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "http/index": "src/http/index.ts",
    "storage/index": "src/storage/index.ts",
    "redux/index": "src/adapters/redux/index.ts",
    "redux/hooks/index": "src/adapters/redux/hooks/index.ts",
    "zustand/index": "src/adapters/zustand/index.ts",
    "tanstack-query/index": "src/adapters/tanstack-query/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: [
    "react",
    "react-redux",
    "redux-saga",
    "@reduxjs/toolkit",
    "axios",
    "zustand",
    "@tanstack/react-query",
  ],
});
