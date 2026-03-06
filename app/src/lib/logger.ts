const isDev = import.meta.env.DEV;

export function logError(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.error(message, ...args);
  }
}
