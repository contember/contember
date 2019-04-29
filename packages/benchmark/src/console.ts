#!/usr/bin/env node

import { CompositionRoot, readConfig } from 'cms-api'
import * as path from 'path'
import App from './projects/app/src/model'
;(async () => {
	const configFile = path.join(__dirname, '../../src/config/config.yaml')
	const config = await readConfig(configFile)
	const projectsDirectory = path.join(__dirname, '../../src/projects')

	const container = new CompositionRoot().createMasterContainer(config, projectsDirectory, {
		app: App
	})

	container.cli.run(process.argv)
})().catch(e => {
	console.log(e)
	process.exit(1)
})
