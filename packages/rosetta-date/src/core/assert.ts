/**
 * Exhaustiveness guard for a discriminated union. The `never` parameter turns an
 * unhandled member into a compile-time error, so adding a union variant forces
 * every dispatch to handle it; the throw guards a caller that bypasses the types.
 *
 * @internal
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`)
}
