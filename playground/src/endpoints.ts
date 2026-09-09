import type { Dialect, Library } from 'rosetta-date'
import { ldml, moment, strftime } from 'rosetta-date/dialects'
import { dateFns, dayjs, momentjs } from 'rosetta-date/libraries'

export type EndpointKind = 'dialect' | 'library'

export interface Endpoint {
  readonly id: string
  readonly label: string
  readonly kind: EndpointKind
  readonly value: Dialect | Library
  /** Export name used in generated snippets. */
  readonly importName: string
  /** Package subpath that exports the endpoint. */
  readonly importFrom: 'rosetta-date/dialects' | 'rosetta-date/libraries'
}

/** Endpoints available in the playground. */
export const endpoints: readonly Endpoint[] = [
  { id: 'moment', label: 'moment', kind: 'dialect', value: moment, importName: 'moment', importFrom: 'rosetta-date/dialects' },
  { id: 'ldml', label: 'ldml', kind: 'dialect', value: ldml, importName: 'ldml', importFrom: 'rosetta-date/dialects' },
  { id: 'strftime', label: 'strftime', kind: 'dialect', value: strftime, importName: 'strftime', importFrom: 'rosetta-date/dialects' },
  { id: 'momentjs', label: 'momentjs', kind: 'library', value: momentjs, importName: 'momentjs', importFrom: 'rosetta-date/libraries' },
  { id: 'dayjs', label: 'dayjs', kind: 'library', value: dayjs, importName: 'dayjs', importFrom: 'rosetta-date/libraries' },
  { id: 'date-fns', label: 'date-fns', kind: 'library', value: dateFns, importName: 'dateFns', importFrom: 'rosetta-date/libraries' },
]

const byId = new Map(endpoints.map(endpoint => [endpoint.id, endpoint]))

export function getEndpoint(id: string): Endpoint | undefined {
  return byId.get(id)
}
