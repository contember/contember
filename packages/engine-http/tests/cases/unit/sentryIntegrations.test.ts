import { expect, test } from 'bun:test'
import * as Sentry from '@sentry/node'
import { filterSentryIntegrations } from '../../../src/utils/sentry.js'

test('outgoing requests are not instrumented, so their URLs stay out of breadcrumbs and spans', () => {
	const defaults = Sentry.getDefaultIntegrations({}).map(it => it.name)
	expect(defaults).toContain('Undici')

	const kept = filterSentryIntegrations(Sentry.getDefaultIntegrations({})).map(it => it.name)

	expect(kept).toContain('LinkedErrors')
	for (const name of ['Undici', 'Http', 'Console']) {
		expect(kept).not.toContain(name)
	}
})
