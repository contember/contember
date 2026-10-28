import { expect, test } from 'bun:test'
import { readConfig } from '../../../src/config/config'

test('shutdownDelayMs: read from CONTEMBER_SHUTDOWN_DELAY_MS', async () => {
	process.env.CONTEMBER_SHUTDOWN_DELAY_MS = '5000'
	try {
		const { serverConfig } = await readConfig()
		expect(serverConfig.shutdownDelayMs).toBe(5000)
	} finally {
		delete process.env.CONTEMBER_SHUTDOWN_DELAY_MS
	}
})

test('shutdownDelayMs: undefined when the variable is unset', async () => {
	const { serverConfig } = await readConfig()
	expect(serverConfig.shutdownDelayMs).toBeUndefined()
})
