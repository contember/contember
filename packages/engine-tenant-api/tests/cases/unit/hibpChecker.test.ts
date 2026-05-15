import { describe, expect, test } from 'bun:test'
import { HttpHibpChecker, NoopHibpChecker } from '../../../src/model/service/HibpChecker'

const makeFetch = (body: string, ok = true): typeof fetch => {
	return (async () => {
		return {
			ok,
			text: async () => body,
		} as Response
	}) as unknown as typeof fetch
}

describe('HibpChecker', () => {
	test('NoopHibpChecker always returns false', async () => {
		expect(await new NoopHibpChecker().isCompromised('hunter2')).toBe(false)
	})

	test('returns true when the suffix matches a positive count', async () => {
		// "password" → SHA1 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8 → prefix 5BAA6, suffix 1E4C9B93F3F0682250B6CF8331B7EE68FD8
		const body = `1E4C9B93F3F0682250B6CF8331B7EE68FD8:12345\nABCDEF:1\n`
		const checker = new HttpHibpChecker('https://api.example.test/range/', makeFetch(body))
		expect(await checker.isCompromised('password')).toBe(true)
	})

	test('returns false when the suffix is not in the result set', async () => {
		const body = `DEADBEEFDEADBEEFDEADBEEFDEADBEEFDEAD:7\n`
		const checker = new HttpHibpChecker('https://api.example.test/range/', makeFetch(body))
		expect(await checker.isCompromised('CorrectHorseBatteryStaple')).toBe(false)
	})

	test('fails open (false) on non-ok responses', async () => {
		const checker = new HttpHibpChecker('https://api.example.test/range/', makeFetch('boom', false))
		expect(await checker.isCompromised('password')).toBe(false)
	})

	test('fails open (false) on fetch error', async () => {
		const fetchImpl = (() => Promise.reject(new Error('network'))) as unknown as typeof fetch
		const checker = new HttpHibpChecker('https://api.example.test/range/', fetchImpl)
		expect(await checker.isCompromised('password')).toBe(false)
	})
})
