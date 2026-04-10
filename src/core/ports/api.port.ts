export interface IApiPort {
  execute<T = unknown>(resource: string, payload?: unknown): Promise<T>;
}
