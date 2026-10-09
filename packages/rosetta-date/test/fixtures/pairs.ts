import type { EndpointName } from './oracle'
import { convert } from 'rosetta-date'
import { endpoints } from './oracle'

/** Every endpoint name, in registry order. */
export const names = Object.keys(endpoints) as EndpointName[]

/** Every ordered pair of distinct endpoints. */
export function pairsOf<Name extends string>(list: readonly Name[]): Array<readonly [Name, Name]> {
  return list.flatMap(from => list.filter(to => to !== from).map(to => [from, to] as const))
}

/** Convert `format` from one endpoint to another and back. */
export function roundTrip(format: string, from: EndpointName, to: EndpointName): string {
  const forward = convert(format, { from: endpoints[from], to: endpoints[to] })
  return convert(forward, { from: endpoints[to], to: endpoints[from] })
}
