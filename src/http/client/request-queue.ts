/**
 * RequestQueue holds axios request configs that failed with 401
 * while a token refresh is in progress. Once refresh completes,
 * flush() retries all queued requests with the new token via
 * the provided retry callback.
 */

type QueueItem = {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export class RequestQueue {
  private queue: QueueItem[] = [];
  public isRefreshing = false;

  /**
   * Enqueue a failed request. Returns a Promise that resolves/rejects
   * once flush() or reject() is called.
   */
  enqueue(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  /**
   * Resolve all queued requests after refresh succeeds.
   */
  flush(): void {
    this.queue.forEach(({ resolve }) => resolve(undefined));
    this.queue = [];
    this.isRefreshing = false;
  }

  /**
   * Reject all queued requests — called when refresh itself fails.
   */
  reject(error: unknown): void {
    this.queue.forEach(({ reject }) => reject(error));
    this.queue = [];
    this.isRefreshing = false;
  }
}

export const requestQueue = new RequestQueue();
