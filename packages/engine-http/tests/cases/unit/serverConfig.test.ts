import { expect, test } from 'vitest'
import { readConfig } from '../../../src/config/config'

// The config template requires both ports, so they are set for the duration of the read.
const readServerConfig = async (env: Record<string, string> = {}) => {
	const vars: Record<string, string> = { CONTEMBER_PORT: '4000', CONTEMBER_MONITORING_PORT: '4001', ...env }
	const previous: [string, string | undefined][] = Object.keys(vars).map(name => [name, process.env[name]])
	Object.assign(process.env, vars)
	try {
		return (await readConfig()).serverConfig
	} finally {
		for (const [name, value] of previous) {
			if (value === undefined) {
				delete process.env[name]
			} else {
				process.env[name] = value
			}
		}
	}
}

test('shutdownDelayMs: read from CONTEMBER_SHUTDOWN_DELAY_MS', async () => {
	const serverConfig = await readServerConfig({ CONTEMBER_SHUTDOWN_DELAY_MS: '5000' })
	expect(serverConfig.shutdownDelayMs).toBe(5000)
})

test('shutdownDelayMs: undefined when the variable is unset', async () => {
	const serverConfig = await readServerConfig()
	expect(serverConfig.shutdownDelayMs).toBeUndefined()
})
