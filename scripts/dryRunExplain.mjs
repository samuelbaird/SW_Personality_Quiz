import { readFile } from 'node:fs/promises'
import process from 'node:process'

const baseUrl = process.env.EXPLAIN_BASE_URL ?? 'http://localhost:3000'

async function run() {
  const fixtureRaw = await readFile(new URL('./explain-fixtures.json', import.meta.url), 'utf8')
  const fixtures = JSON.parse(fixtureRaw)

  console.log(`Running ${fixtures.length} explanation fixtures against ${baseUrl}/api/explain`)

  for (const fixture of fixtures) {
    const started = Date.now()
    const response = await fetch(`${baseUrl}/api/explain?nocache=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fixture.payload),
    })
    const elapsed = Date.now() - started
    const body = await response.json().catch(() => ({}))

    console.log(`\n[${fixture.name}] status=${response.status} latency=${elapsed}ms source=${body.source ?? 'n/a'}`)
    console.log(body.explanation ?? '<empty>')
  }
}

run().catch((error) => {
  console.error('dryRunExplain failed:', error)
  process.exit(1)
})
