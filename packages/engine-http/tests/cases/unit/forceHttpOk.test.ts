import { expect, test } from 'bun:test'
import { IncomingMessage } from 'node:http'
import { isForceHttpOkRequested, isGraphqlModule } from '../../../src/application/forceHttpOk'
import { serverConfigSchema } from '../../../src/config/configSchema'

const requestWith = (headers: Record<string, string | string[] | undefined>): IncomingMessage => ({ headers } as unknown as IncomingMessage)

test('isForceHttpOkRequested: false when header absent', () => {
	expect(isForceHttpOkRequested(requestWith({}))).toBe(false)
})

test('isForceHttpOkRequested: truthy values', () => {
	for (const value of ['1', 'true', 'on', 'yes', 'TRUE', ' True ']) {
		expect(isForceHttpOkRequested(requestWith({ 'x-contember-force-ok': value }))).toBe(true)
	}
})

test('isForceHttpOkRequested: falsy/unrecognized values', () => {
	for (const value of ['0', 'false', 'off', 'no', '']) {
		expect(isForceHttpOkRequested(requestWith({ 'x-contember-force-ok': value }))).toBe(false)
	}
})

test('isForceHttpOkRequested: array header uses first value', () => {
	expect(isForceHttpOkRequested(requestWith({ 'x-contember-force-ok': ['true', 'false'] }))).toBe(true)
	expect(isForceHttpOkRequested(requestWith({ 'x-contember-force-ok': ['false', 'true'] }))).toBe(false)
})

test('isGraphqlModule: only content/tenant/system', () => {
	expect(isGraphqlModule('content')).toBe(true)
	expect(isGraphqlModule('tenant')).toBe(true)
	expect(isGraphqlModule('system')).toBe(true)
	expect(isGraphqlModule('transfer')).toBe(false)
	expect(isGraphqlModule('misc')).toBe(false)
	expect(isGraphqlModule(undefined)).toBe(false)
})

const responseStatusHeader = (val: unknown): unknown => serverConfigSchema({ http: { responseStatusHeader: val } }).http?.responseStatusHeader

test('config responseStatusHeader: undefined when absent', () => {
	expect(serverConfigSchema({}).http?.responseStatusHeader).toBeUndefined()
})

test('config responseStatusHeader: accepts boolean and boolean-ish strings', () => {
	expect(responseStatusHeader(true)).toBe(true)
	expect(responseStatusHeader('true')).toBe(true)
	expect(responseStatusHeader('1')).toBe(true)
	expect(responseStatusHeader('on')).toBe(true)
	expect(responseStatusHeader(false)).toBe(false)
	expect(responseStatusHeader('false')).toBe(false)
	expect(responseStatusHeader('0')).toBe(false)
	expect(responseStatusHeader('off')).toBe(false)
})

test('config responseStatusHeader: invalid value throws', () => {
	expect(() => responseStatusHeader('maybe')).toThrow()
})
