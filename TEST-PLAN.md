# Reestruturação dos testes do `rosetta-date`

Plano aprovado em 2026-10-06 (todas as decisões fechadas; entrega num commit único). Revisado na
mesma data após revisão independente. Escopo: `packages/rosetta-date`. Referência de práticas: skill
`ts-package-testing` (`~/.claude/skills/ts-package-testing`).

## Estado de partida

- 14 arquivos de teste, 3794 testes, cobertura 100% (lines/branches/functions/statements), ~0,5 s.
  Versões do lockfile: Vitest 5.0.3, Vite 8.3.2, TypeScript 6.0.3, tsdown 0.23.0. Node ≥ 22.12.
- 12 arquivos colocados em `src/**`, 2 suítes + oráculo em `test/` (`fixtures.ts`, `matrix.test.ts`,
  `round-trip.test.ts`).
- Nenhum teste de tipos existe (`expectTypeOf`, `assertType`, `@ts-expect-error`, `*.test-d.ts`: zero
  ocorrências). A camada de tipos é criada, não reescrita.
- Nada valida o `dist` nem os 4 subpaths de `exports` (`.`, `./dialects`, `./libraries`, `./intl`).
- `tsc --noEmit` do pacote já inclui `test/` (é o que faz `Record<DialectName, …>` em `fixtures.ts`
  exigir uma entrada por dialeto registrado).
- Lint: `@antfu/eslint-config` aplica as regras `test/*` só a `**/*.test.*`, `**/*.spec.*`,
  `**/__tests__/**`. Exige `it` (não `test`), títulos em minúsculas, sem títulos duplicados. O plugin
  `test` é registrado globalmente (`antfu/test/setup`), então um bloco `.append` para `*.test-d.ts`
  funciona.
- `.gitignore` (`dist`) e `eslint.config.js` (`**/dist`) ignoram qualquer pasta chamada `dist`,
  inclusive dentro de `test/`.

## Decisões

| #   | Decisão                                                      | Escolha                                                                                                                                                                                |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Layout                                                       | Pastas por tipo de teste em `test/`; `unit/` espelha `src/`                                                                                                                            |
| D2  | Imports                                                      | Alias do nome do pacote (`rosetta-date`, `rosetta-date/{dialects,libraries,intl}`) → `src`; internals por caminho relativo                                                             |
| D3  | Contrato vs. internals                                       | API pública onde existe equivalente; estratégias de syntax (incluindo o guard de `resolveSyntax`), totalidade e `escapeLiteral` continuam internos; testes de identidade de cache saem |
| D4  | Tipos                                                        | `*.test-d.ts` checados contra `src` (Vitest typecheck) e contra `dist` (tsconfig com resolução Node normal)                                                                            |
| D5  | Artefato                                                     | Smoke test em Node puro sobre o `dist`; rodar a suíte inteira contra o `dist` e checar tree-shaking ficam fora                                                                         |
| D6  | Momento                                                      | Agora, no `main`; branches abertas fazem rebase                                                                                                                                        |
| D7  | Skills `rosetta-date-maintenance` / `rosetta-date-extension` | Atualizar junto                                                                                                                                                                        |
| D8  | Projetos Vitest                                              | `test.projects` inline: `unit`, `endpoints`, `types`; coverage na raiz                                                                                                                 |
| D9  | Agrupamento dos testes de tipos                              | Por assunto (`<assunto>.test-d.ts`), não por entrypoint                                                                                                                                |
| D10 | `attw`                                                       | `@arethetypeswrong/cli` em `test:dist`                                                                                                                                                 |
| D11 | Tree-shaking                                                 | Fora; tarefa separada                                                                                                                                                                  |

Invariantes que não mudam:

- A estrutura do oráculo: campos keyed por endpoint (`expectations`, `libraryDeltas`, `aliases`),
  composites keyed por dialeto. O oráculo continua independente das tabelas de dialeto.
- Threshold de cobertura em 100%.
- Zero dependências de runtime; nenhum arquivo de teste entra no pacote publicado (`files: ["dist"]`).

## Layout alvo

```text
packages/rosetta-date/test/
  fixtures/
    oracle.ts              ← test/fixtures.ts (renomeado, conteúdo igual)
    pairs.ts               ← helpers duplicados hoje em matrix/round-trip (names, pairs, roundTrip)
  unit/
    converter.test.ts               convert / createConverter, armadilhas de maiúsculas
    converter.literals.test.ts      literais, runs desconhecidos, delimitadores malformados
    converter.unsupported.test.ts   política onUnsupportedToken, reasons, contexto do handler, adjacência
    describe.test.ts
    explain.test.ts
    core/
      canonical.test.ts    valores dos símbolos + ordem identidade→apresentação dos qualifiers
      decode.test.ts       decodeCanonical
      dialect.test.ts      defineDialect (validação, composites, dialetos custom)
      library.test.ts      defineLibrary (validação, extends custom)
      errors.test.ts       UnsupportedTokenError (name, message por reason)
      tokenize.test.ts     longest-match independente da ordem de declaração
      syntax/
        delimited.test.ts
        index.test.ts      guard de exaustividade de resolveSyntax
    dialects/
      registry.test.ts     getDialect
      ldml.test.ts         ldml puro não reconhece extensões do date-fns
      strftime.test.ts
    libraries/
      registry.test.ts     getLibrary
      dayjs.test.ts        grafia de saída é do dialeto
      date-fns.test.ts     presets localizados de largura diferente
    intl/
      to-intl-options.test.ts
      from-intl-options.test.ts
      mapping.test.ts      consistência das tabelas forward/reverse (internal)
  endpoints/
    conformance.test.ts    conformidade + aliases + totalidade
    matrix.test.ts
    round-trip.test.ts
  types/
    index.test-d.ts
    dialects.test-d.ts
    libraries.test-d.ts
    intl.test-d.ts
    tsconfig.dist.json
  artifact/
    smoke.mjs              (não pode chamar `dist/`: ver "Estado de partida")
```

Sufixo por tema (`converter.literals.test.ts`) segue o guia do Vitest para dividir arquivos grandes por
assunto.

## Mapa de origem → destino

Granularidade: bloco `describe`; quando um bloco se divide, cada `it` está listado.

| Origem                                          | Bloco / teste                                                     | Destino                                                                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/converter.test.ts`                         | `convert`, `createConverter`                                      | `unit/converter.test.ts`                                                                                         |
|                                                 | `getDialect`                                                      | `unit/dialects/registry.test.ts`                                                                                 |
|                                                 | `onUnsupportedToken policy`                                       | `unit/converter.unsupported.test.ts`                                                                             |
| `src/canonical.test.ts` (um `describe`, 3 `it`) | `exposes the named symbols…`                                      | `unit/core/canonical.test.ts`                                                                                    |
|                                                 | `builds a custom dialect…`                                        | `unit/core/dialect.test.ts`                                                                                      |
|                                                 | `bridges a custom extends token…`                                 | `unit/core/library.test.ts`                                                                                      |
| `src/core/canonical.test.ts`                    | inteiro                                                           | `unit/core/canonical.test.ts`                                                                                    |
| `src/core/dialect.test.ts`                      | inteiro                                                           | `unit/core/dialect.test.ts`                                                                                      |
| `src/core/engine.test.ts`                       | `moment → ldml`: `resolves the capital-letter traps…`             | `unit/converter.test.ts`                                                                                         |
|                                                 | `moment → ldml`: demais 4 `it`                                    | `unit/converter.literals.test.ts`                                                                                |
|                                                 | `unsupported same-letter runs and adjacent literals`              | `unit/converter.literals.test.ts`                                                                                |
|                                                 | `tokenization and caching`: longest-match                         | `unit/core/tokenize.test.ts`                                                                                     |
|                                                 | `tokenization and caching`: cache de `renderedTokens`             | fase 2: `unit/core/render.test.ts` provisório; fase 3: removido                                                  |
|                                                 | `the pure ldml dialect excludes date-fns extensions`              | `unit/dialects/ldml.test.ts`                                                                                     |
|                                                 | `ldml → moment`                                                   | `unit/converter.literals.test.ts`                                                                                |
|                                                 | `malformed delimiters degrade…`                                   | `unit/converter.literals.test.ts`                                                                                |
|                                                 | `unrepresentable adjacency…`                                      | `unit/converter.unsupported.test.ts`                                                                             |
| `src/core/syntax/delimited.test.ts`             | inteiro                                                           | `unit/core/syntax/delimited.test.ts`                                                                             |
| `src/core/syntax/index.test.ts`                 | inteiro                                                           | `unit/core/syntax/index.test.ts`; fase 3 remove `caches the strategy…` e `resolves each family…`, mantém o guard |
| `src/describe.test.ts`                          | inteiro                                                           | `unit/describe.test.ts`                                                                                          |
| `src/explain.test.ts`                           | inteiro                                                           | `unit/explain.test.ts`                                                                                           |
| `src/dialects/strftime.test.ts`                 | inteiro                                                           | `unit/dialects/strftime.test.ts`                                                                                 |
| `src/intl/intl.test.ts`                         | `decodeCanonical`                                                 | `unit/core/decode.test.ts`                                                                                       |
|                                                 | `toIntlOptions`                                                   | `unit/intl/to-intl-options.test.ts`                                                                              |
|                                                 | `fromIntlOptions`, `round trip across the Intl boundary`          | `unit/intl/from-intl-options.test.ts`                                                                            |
|                                                 | `forward/reverse table consistency`                               | `unit/intl/mapping.test.ts`                                                                                      |
| `src/libraries/libraries.test.ts`               | `output spelling is a dialect concern…`                           | `unit/libraries/dayjs.test.ts`                                                                                   |
|                                                 | `mismatched-width localized presets…`                             | `unit/libraries/date-fns.test.ts`                                                                                |
|                                                 | `unsupported-token reasons & policy…`, `handler library context…` | `unit/converter.unsupported.test.ts`                                                                             |
|                                                 | `defineLibrary validation`                                        | `unit/core/library.test.ts`                                                                                      |
|                                                 | `getLibrary`                                                      | `unit/libraries/registry.test.ts`                                                                                |
| `test/fixtures.ts`                              | inteiro                                                           | `fixtures/oracle.ts`                                                                                             |
| `test/matrix.test.ts`                           | `endpoint conformance`, `aliases parse…`, `endpoint totality`     | `endpoints/conformance.test.ts`                                                                                  |
|                                                 | `cross-endpoint conversion matrix`                                | `endpoints/matrix.test.ts`                                                                                       |
| `test/round-trip.test.ts`                       | inteiro                                                           | `endpoints/round-trip.test.ts`                                                                                   |

## Fase 1: setup

Sem mover arquivos. `vitest.config.ts` desta fase separa os projetos sobre os globs atuais e adiciona
alias e typecheck:

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const src = (path: string): string => fileURLToPath(new URL(`./src/${path}`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: [
      { find: /^rosetta-date$/, replacement: src('index.ts') },
      { find: /^rosetta-date\/(dialects|libraries|intl)$/, replacement: src('$1/index.ts') },
    ],
  },
  test: {
    projects: [
      { test: { name: 'unit', include: ['src/**/*.test.ts'] } },
      { test: { name: 'endpoints', include: ['test/*.test.ts'] } },
      {
        test: {
          name: 'types',
          include: ['test/types/**/*.test-d.ts'],
          typecheck: { enabled: true, include: ['test/types/**/*.test-d.ts'] },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
})
```

- Projetos (skill, `setup-and-layout.md`: usar `projects` quando as configurações diferem). `types` é o
  único com typecheck; `unit` e `endpoints` separam teste de unidade das suítes do oráculo. Projetos
  inline herdam a config raiz (alias e `expect.requireAssertions` valem para todos); `coverage` fica
  só na raiz e agrega todos. `name` é único por projeto.
- Seleção: `vitest --project unit` (repetível, aceita `!`). O typecheck e o aviso "experimental" ficam
  confinados ao projeto `types`, então `pnpm test:watch --project unit` não paga esse custo.
  Verificado no Vitest 5.0.3 numa cópia do pacote: 3 projetos, cobertura 100% agregada, alias herdado,
  `--project unit` em 266 ms sem typecheck.
- No projeto `types`, os `*.test-d.ts` estão em `include` e em `typecheck.include`: um erro de digitação
  sob `@ts-expect-error` vira `ReferenceError` em runtime em vez de passar calado (skill,
  `types-and-built-output.md`).
- O check contra o `dist` não vira projeto: depende de build e roda por `tsc` em `test:dist` (Fase 4),
  fora do `vitest run` padrão.
- `tsconfig.json` do pacote ganha `paths` só para os subpaths do `exports`:
  `"rosetta-date": ["./src/index.ts"]`, `"rosetta-date/dialects": ["./src/dialects/index.ts"]`,
  `"rosetta-date/libraries": ["./src/libraries/index.ts"]`, `"rosetta-date/intl": ["./src/intl/index.ts"]`.
  Verificado: `tsc --noEmit` passa e o `dist` do tsdown sai idêntico com e sem `paths`.
- `typecheck.ignoreSourceErrors: true` no projeto `types`: `tsc --noEmit` já cobre `src`, e o Vue Router
  usa a mesma opção porque o tsbuildinfo incremental do Vitest pode ficar velho e reportar erros
  fantasmas (skill `vue-package-testing`, `type-tests.md`).
- `eslint.config.js`: `.append({ files: ['**/*.test-d.ts'], rules: { 'test/consistent-test-it': …,
  'test/no-identical-title': 'error', 'test/no-only-tests': 'error', 'test/prefer-lowercase-title':
  'error' } })`.
- `.gitignore`: adicionar `.vitest/`.

Verificação: 3794 testes, 100%, com os arquivos ainda em `src`.

## Fase 2: mover sem mudar comportamento

Sem commit intermediário: toda a reestruturação entra num commit único no fim. A fase 2 é um ponto de
verificação no working tree.

1. `git mv` 1:1 dos arquivos que não se dividem (`dialect`, `canonical` de `core`, `delimited`,
   `syntax/index`, `describe`, `explain`, `strftime`, `fixtures`, `round-trip`). Só imports mudam.
2. Divisões conforme o mapa, movendo `describe` ou `it` inteiros sem reescrever o corpo. O cache de
   `renderedTokens` vai para `unit/core/render.test.ts` provisório.

No fim da fase, apontar os projetos para as pastas novas (`unit` → `test/unit/**/*.test.ts`,
`endpoints` → `test/endpoints/**/*.test.ts`) e remover o `exclude` de `src/**/*.test.ts` da coverage.

Critério de saída: 3794 testes, mesmos títulos, cobertura 100%, nenhum `*.test.ts` em `src`.

## Fase 3: refatorar para a skill

Remoções (contagem cai de 3): cache de `renderedTokens` (apaga `unit/core/render.test.ts`), e em
`unit/core/syntax/index.test.ts` os testes `caches the strategy by config identity` e
`resolves each family to its own strategy`. Com isso a afirmação documentada de cache por identidade
(`docs/content/guides/converting.mdx:66`, `guides/custom-dialects.mdx:117`) fica sem teste; é uma
garantia de performance, sem efeito observável no resultado.

Troca de internals por API pública:

| Uso interno                           | Arquivo                           | Equivalente público                                                                                                                      |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `parse` na conformidade e nos aliases | `endpoints/conformance.test.ts`   | `describe(token, endpoint)` com `toMatchObject([{ kind: 'field', canonical, token }])`                                                   |
| `render` na conformidade              | `endpoints/conformance.test.ts`   | `convert(token, { from: endpoint, to: endpoint })` (passa por `parse` + `render`; `explain` não serve, ele só consulta `renderedTokens`) |
| `m2u`/`u2m` com `parse` + `render`    | `unit/converter.literals.test.ts` | `convert`                                                                                                                                |
| `parse` no filtro `renderable`        | `endpoints/round-trip.test.ts`    | `describe`                                                                                                                               |
| `renderedTokens(dayjs)`               | `unit/libraries/dayjs.test.ts`    | `explain`/`convert`                                                                                                                      |
| `parse` no longest-match              | `unit/core/tokenize.test.ts`      | `describe`                                                                                                                               |

Continuam internos, sem equivalente público: `renderedTokens` na totalidade,
`resolveSyntax(…).escapeLiteral` na matriz, `delimitedStrategy`, o guard de `resolveSyntax`,
`canonicalToIntl`/`intlToCanonical` em `mapping.test.ts`.

Regras, arquivo a arquivo:

| Regra                       | Ação                                                                                                                                                                          | Ocorrências conhecidas                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Erro com `try/catch` + cast | `toThrow(UnsupportedTokenError)` + `toThrow(expect.objectContaining({ token, reason }))`, ou `objectContaining` com `name: 'UnsupportedTokenError'` (testado no Vitest 5.0.3) | `src/converter.test.ts:44`, `src/core/engine.test.ts:147`, `src/libraries/libraries.test.ts:50`                       |
| `.toThrow()` sem matcher    | verificar `reason` e `token`                                                                                                                                                  | `strftime.test.ts` (4: linhas 36, 46, 57, 99), `intl.test.ts` (5: linhas 98, 183–186)                                 |
| Um comportamento por teste  | `it.for` com objetos (`$from → $to`)                                                                                                                                          | `converts in both directions`, `getDialect`, `covers the remaining mappable components`, maioria de `strftime`/`intl` |
| `it.each`                   | `it.for` (lint exige `it`)                                                                                                                                                    | `dialect.test.ts`, suítes de `endpoints/`                                                                             |
| Nome de teste               | comportamento, sem "and", sem parênteses explicativos                                                                                                                         | revisar todos                                                                                                         |
| Comentários                 | manter o *porquê* do domínio, cortar o que repete a asserção                                                                                                                  | revisar todos                                                                                                         |
| `describe as group`         | importar a lib como `describe as describePattern` e manter o `describe` do Vitest                                                                                             | `describe.test.ts`, `explain.test.ts`                                                                                 |
| Asserções em callbacks      | ligar `expect.requireAssertions: true` no config                                                                                                                              | handlers que preenchem arrays em `converter.unsupported.test.ts`                                                      |

`defineDialect returns the same object` fica: o contrato está no TSDoc (`src/core/dialect.ts:73`,
"@returns The same Dialect object passed as `definition`").

Se algum branch perder cobertura, cobrir pelo comportamento público que o exercita; nunca
reintroduzir um teste de implementação para fechar o número.

## Fase 4: tipos e artefato

`test/types/<assunto>.test-d.ts` (D9), importando pelos nomes do pacote. Os itens abaixo se
redistribuem por assunto (`convert`, `canonical`, `dialect`, `library`, `unsupported`, `introspection`,
`intl`):

- `index.test-d.ts`: `Canonical.YearNumeric` é `'year/numeric'`; `CanonicalToken` é a união dos
  valores; `TokenRule['canonical']` rejeita `string` (`@ts-expect-error`); `DirectiveSyntax` exige
  `marker`; `ConvertOptions['from' | 'to']` aceita `Dialect | Library` e rejeita string;
  `UnsupportedTokenHandler` aceita retorno `string | typeof Unsupported.drop | typeof
  Unsupported.literalize | undefined` e rejeita `number`; `UnsupportedTokenError` estende `Error` com
  `reason: UnsupportedTokenReason`; narrowing de `DescribedSegment` por `kind` e de `ExplainedSegment`
  por `status` expõe `target`; `createConverter` retorna `Converter`; `defineDialect` retorna `Dialect`.
- `dialects.test-d.ts`: `DialectName` é `'moment' | 'ldml' | 'strftime'`; `getDialect('foo')` não
  compila.
- `libraries.test-d.ts`: `LibraryName`; `getLibrary('foo')` não compila; `defineLibrary` retorna
  `Library` com `resolved`; `Library['supports']` é `ReadonlySet<CanonicalToken> | undefined`
  (opcional com `exactOptionalPropertyTypes`).
- `intl.test-d.ts`: `IntlUnsupportedPolicy` rejeita handler; tipos de entrada/saída de
  `toIntlOptions`/`fromIntlOptions`.

Contra o `dist`:

- `test/types/tsconfig.dist.json` estende `../../../../tsconfig.base.json` (não o tsconfig do pacote,
  que mapeia para `src`), sem `paths`, incluindo só `test/types/*.test-d.ts`. `rosetta-date*` resolve
  por auto-referência via `exports[…].types`, que é o caminho do consumidor (verificado com
  `--traceResolution`).
- `test/artifact/smoke.mjs`: imports estáticos dos 4 subpaths pelo nome do pacote, chama `convert`,
  `describe`, `toIntlOptions` e lança `Error` se o resultado divergir. Sem `console`, sem Vitest, sem
  alias. O motivo da skill para `import()` dinâmico (setar `NODE_ENV` antes) não se aplica: o pacote não
  ramifica por `NODE_ENV`.
- `attw` (D10): `@arethetypeswrong/cli` como devDependency (via catalog), rodando `attw --pack . --profile esm-only`
  (confirmar a flag de perfil na versão instalada).
- Script `test:dist`: `tsc -p test/types/tsconfig.dist.json && node test/artifact/smoke.mjs && attw …`.
- `turbo.json`: task `test:dist` com `dependsOn: ["build"]`, `outputs: []`. Script raiz
  `test:dist: turbo run test:dist --filter=rosetta-date`.
- CI: `pnpm test:dist` logo após `pnpm build`.

## Fase 5: lacunas de caso de uso

Confirmadas como não cobertas:

- `getDialect('strftime')`.
- `UnsupportedTokenError`: `name` e `message` para os 4 `reason`.
- `describe`/`explain` sobre composite `strftime` (`%T`).
- `toIntlOptions` com origem `strftime`; `fromIntlOptions` com destino `strftime`.
- `convert('')`.

Fora (D11): checagem de tree-shaking do artefato, como tarefa separada.

Opcional: `sequence.shuffle: true` para expor dependência de ordem (caches de módulo).

## Fase 6: documentação

- `docs/content/contributing.mdx`: tabela de comandos (linhas 22–28, somar `pnpm test:dist`), caminho
  do oráculo em "Adding a dialect or library" (linha 33), o parágrafo das linhas 38–41 que ainda diz que
  `strftime` está fora do oráculo, e a seção Testing (linhas 116–131), incluindo os projetos Vitest e `--project`.
- `CLAUDE.md` e `AGENTS.md` (locais, git-excluded): seção Testing, linhas 91–97.
- Skills, conforme D7: `rosetta-date-maintenance/SKILL.md:137,141,143`;
  `rosetta-date-extension/SKILL.md:9,51,52,149,168,172,222`.
- Sem changeset: nada muda para quem consome o pacote.

## Verificação por fase

`pnpm lint`, `pnpm typecheck`, `pnpm test:coverage`, `pnpm build`; a partir da fase 4 também
`pnpm test:dist`. Antes de fechar a fase 6, `pnpm docs:build`.

Não verificado ainda: CI real no GitHub, `turbo run test:dist`, comportamento no Windows.
