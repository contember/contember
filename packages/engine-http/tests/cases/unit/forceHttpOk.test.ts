import { expect, test } from 'bun:test'
import { IncomingMessage } from 'node:http'
import { isForceHttpOkRequested, isGraphqlModule, shouldForceHttpOk } from '../../../src/application/forceHttpOk.js'
import { serverConfigSchema } from '../../../src/config/configSchema.js'

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

const baseDecision = {
	enabled: true,
	status: 401,
	module: 'tenant' as string | undefined,
	hasBody: true,
	headerRequested: true,
}

test('shouldForceHttpOk: coerces when all conditions hold', () => {
	expect(shouldForceHttpOk(baseDecision)).toBe(true)
})

test('shouldForceHttpOk: kill-switch (enabled=false) suppresses coercion even with header', () => {
	expect(shouldForceHttpOk({ ...baseDecision, enabled: false })).toBe(false)
})

test('shouldForceHttpOk: no coercion when header not requested', () => {
	expect(shouldForceHttpOk({ ...baseDecision, headerRequested: false })).toBe(false)
})

test('shouldForceHttpOk: leaves a successful (200) response untouched', () => {
	expect(shouldForceHttpOk({ ...baseDecision, status: 200 })).toBe(false)
})

test('shouldForceHttpOk: only GraphQL modules are coerced', () => {
	expect(shouldForceHttpOk({ ...baseDecision, module: 'content' })).toBe(true)
	expect(shouldForceHttpOk({ ...baseDecision, module: 'system' })).toBe(true)
	expect(shouldForceHttpOk({ ...baseDecision, module: 'transfer' })).toBe(false)
	expect(shouldForceHttpOk({ ...baseDecision, module: undefined })).toBe(false)
})

test('shouldForceHttpOk: no coercion without a (JSON) body', () => {
	expect(shouldForceHttpOk({ ...baseDecision, hasBody: false })).toBe(false)
})
