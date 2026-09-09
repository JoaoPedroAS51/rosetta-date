/**
 * Throws if a value reaches a branch that TypeScript considers exhaustive.
 *
 * @internal
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`)
}
