import type { IApiPort } from "../../core/ports/api.port";
import type { IStoragePort } from "../../core/ports/storage.port";

export interface RootSagaDependencies {
  apiPort: IApiPort;
  storageByResource: Partial<Record<string, IStoragePort>>;
}
