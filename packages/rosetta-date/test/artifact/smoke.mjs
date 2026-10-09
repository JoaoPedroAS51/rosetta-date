import { convert, describe } from 'rosetta-date'
import { ldml, moment } from 'rosetta-date/dialects'
import { toIntlOptions } from 'rosetta-date/intl'
import { dayjs } from 'rosetta-date/libraries'

function check(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
}

check('convert', convert('DD/MM/YYYY', { from: moment, to: ldml }), 'dd/MM/yyyy')
check('convert to a library', convert('yyyy-MM-dd', { from: ldml, to: dayjs }), 'YYYY-MM-DD')
check('describe', describe('YYYY', moment).map(segment => segment.kind), ['field'])
check('toIntlOptions', toIntlOptions('YYYY-MM-DD', { from: moment }), { year: 'numeric', month: '2-digit', day: '2-digit' })
