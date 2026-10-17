/** Cancela a espera e libera um recurso que resolver depois do cancelamento. */
export function acquireAbortable<T>(
  acquire: () => Promise<T>,
  release: (resource: T) => void,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) return Promise.reject(new DOMException("Cancelado.", "AbortError"));

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Cancelado.", "AbortError"));
    signal?.addEventListener("abort", onAbort, { once: true });

    Promise.resolve().then(() => {
      if (signal?.aborted) throw new DOMException("Cancelado.", "AbortError");
      return acquire();
    }).then(
      (resource) => {
        signal?.removeEventListener("abort", onAbort);
        if (signal?.aborted) {
          release(resource);
        } else {
          resolve(resource);
        }
      },
      (error: unknown) => {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}
