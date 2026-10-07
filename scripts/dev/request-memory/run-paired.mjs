// usage: run-paired.mjs <out.jsonl> <rounds> <runtimes,csv> <scenarios,csv> <label=bundle:mode>...
import { appendFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const [output, roundsArg, runtimesArg, scenariosArg, ...variantArgs] = process.argv.slice(2)
const variants = variantArgs.map(arg => {
	const [label, rest] = arg.split('=')
	const [bundle, mode] = rest.split(':')
	return { label, bundle, mode }
})
for (const runtime of runtimesArg.split(',')) {
	for (const scenario of scenariosArg.split(',')) {
		for (let round = 0; round < Number(roundsArg); round++) {
			const order = variants.map((_, i) => variants[(i + round) % variants.length])
			for (const variant of order) {
				const result = spawnSync(runtime, ['--expose-gc', variant.bundle, scenario, variant.mode, 'sampled'], {
					encoding: 'utf8',
					timeout: 300_000,
					maxBuffer: 16 * 1024 * 1024,
				})
				if (result.status !== 0 || result.error) throw new Error(`${runtime}/${scenario}/${variant.label}: ${result.error ?? result.stderr}`)
				const value = JSON.parse(result.stdout.trim())
				appendFileSync(output, `${JSON.stringify({ ...value, round, label: variant.label })}\n`)
			}
		}
		console.error(`${runtime} ${scenario} done`)
	}
}
