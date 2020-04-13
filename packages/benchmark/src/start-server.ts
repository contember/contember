#!/usr/bin/env node

import { readConfig, run } from '@contember/engine-server'
import * as path from 'path'
;(async () => {
	const configFile = path.join(__dirname, '../../src/config/config.yaml')
	const projectsDirectory = path.join(__dirname, '../../src/projects/')
	await run(false, await readConfig([configFile]), projectsDirectory, [])
})().catch(e => {
	console.log(e)
	process.exit(1)
})
