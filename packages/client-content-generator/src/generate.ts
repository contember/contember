#!/usr/bin/env node
import { GenerateContentClient } from './GenerateContentClient'

(async () => {
	await new GenerateContentClient().run(process.argv.slice(2))
})().catch(e => {
	console.error(e)
	process.exit(1)
})
