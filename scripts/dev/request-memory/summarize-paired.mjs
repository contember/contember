// usage: summarize-paired.mjs <results.jsonl> <baseline label>
import { readFileSync } from 'node:fs'

const records = readFileSync(process.argv[2], 'utf8').trim().split('\n').map(line => JSON.parse(line))
const baselineLabel = process.argv[3] ?? 'off'
const median = values => {
	const sorted = [...values].sort((a, b) => a - b)
	const middle = Math.floor(sorted.length / 2)
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const percent = value => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
const unique = values => [...new Set(values)]
const labels = unique(records.map(row => row.label)).filter(label => label !== baselineLabel)

for (const runtime of unique(records.map(row => row.runtime))) {
	console.log(`\n## ${runtime}\n`)
	console.log(`| Scenario | ${baselineLabel} CPU ms | ${labels.map(label => `${label} (range) | est. MiB`).join(' | ')} |`)
	console.log(`|---|---:|${labels.map(() => '---:|---:|').join('')}`)
	for (const scenario of unique(records.filter(row => row.runtime === runtime).map(row => row.scenario))) {
		const rows = records.filter(row => row.runtime === runtime && row.scenario === scenario)
		const baseline = rows.filter(row => row.label === baselineLabel)
		const cells = labels.map(label => {
			const candidate = rows.filter(row => row.label === label)
			const changes = candidate.map(row => (row.cpuMs / baseline.find(base => base.round === row.round).cpuMs - 1) * 100)
			const estimate = median(candidate.map(row => (row.budget?.estimatedPeakBytes ?? 0) / 1024 / 1024))
			return `${percent(median(changes))} (${percent(Math.min(...changes))}…${percent(Math.max(...changes))}) | ${estimate.toFixed(2)}`
		})
		console.log(`| ${scenario} | ${median(baseline.map(row => row.cpuMs)).toFixed(0)} | ${cells.join(' | ')} |`)
	}
}
