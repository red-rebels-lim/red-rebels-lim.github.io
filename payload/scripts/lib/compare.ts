// Key-order-insensitive (but array-order-sensitive) serialization used by the
// parity checkers to compare DB-derived output against the frozen contract.

export function sortedStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )
}
