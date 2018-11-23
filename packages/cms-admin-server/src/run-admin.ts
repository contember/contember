#!/usr/bin/env node

import { ConfigLoader } from 'cms-server-common'
import Server from './Server'
;(async () => {
	try {
		const configFile = process.cwd() + '/src/config/config.yaml'
		const loader = new ConfigLoader()
		const config = await loader.load(configFile, {
			env: process.env
		})
		const server = new Server()
		server.run(config)
	} catch (e) {
		console.error(e)
		process.exit(1)
	}
})().catch(e => {
	console.error(e)
	process.exit(1)
})
