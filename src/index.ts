// ─── Core Entities & Ports ───────────────────────────────────────────────────
export * from "./core/entities/resource.entity";
export * from "./core/entities/error.entity";
export * from "./core/ports/api.port";
export * from "./core/ports/storage.port";

// ─── Shared Config ───────────────────────────────────────────────────────────
export * from "./config/lib-config";

// ─── Shared Runtime Modules ──────────────────────────────────────────────────
export * from "./http/index";
export * from "./storage/index";

// ─── Shared Utilities ────────────────────────────────────────────────────────
export { normalizeError, isNormalizedApiError } from "./utils/error.utils";
