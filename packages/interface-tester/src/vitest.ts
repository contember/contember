import { describe, test } from 'vitest'

import { Config } from './config'
import { getTests } from './tests'

export const testInterface = (config: Config) => {
	describe('interface pages', async () => {
		const tests = await getTests(config)
		for (const { testName, execute } of tests) {
			test(testName, execute)
		}
	})
}
