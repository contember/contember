#!/usr/bin/env node

import { readConfig, createContainer } from '@contember/engine-server'
import * as path from 'path'
;(async () => {
	const configFile = path.join(__dirname, '../../src/config/config.yaml')
	const projectsDirectory = path.join(__dirname, '../../src/projects/')
	const config = await readConfig([configFile])
	const container = await createContainer(false, config, projectsDirectory, [])
	await container.initializer.initialize()
	await container.koa.listen(config.server.port)
})().catch(e => {
	console.log(e)
	process.exit(1)
})
