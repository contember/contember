import { afterEach, describe, expect, test } from 'bun:test'
import { generateUuidV4, generateUuidV7, isUuid } from '../../src/index.js'
import { createUuidV7Generator } from '../../src/uuid/uuid.js'

const uuidShape = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('generateUuidV4', () => {
	afterEach(() => {
		Reflect.set(crypto, 'randomUUID', originalRandomUUID)
	})
	const originalRandomUUID = crypto.randomUUID

	test('produces a version 4, RFC 9562 variant id', () => {
		const id = generateUuidV4()
		expect(id).toMatch(uuidShape)
		expect(id[14]).toBe('4')
		expect('89ab').toContain(id[19])
	})

	test('falls back to getRandomValues outside a secure context', () => {
		Reflect.set(crypto, 'randomUUID', undefined)
		const ids = new Set(Array.from({ length: 100 }, () => generateUuidV4()))
		expect(ids.size).toBe(100)
		for (const id of ids) {
			expect(id).toMatch(uuidShape)
			expect(id[14]).toBe('4')
			expect('89ab').toContain(id[19])
		}
	})
})

const timestampOf = (id: string) => Number.parseInt(id.replace(/-/g, '').slice(0, 12), 16)

describe('generateUuidV7', () => {
	test('produces a version 7, RFC 9562 variant id with the current time', () => {
		const before = Date.now()
		const id = generateUuidV7()
		expect(id).toMatch(uuidShape)
		expect(id[14]).toBe('7')
		expect('89ab').toContain(id[19])
		expect(timestampOf(id)).toBeGreaterThanOrEqual(before)
		expect(timestampOf(id)).toBeLessThanOrEqual(Date.now())
	})

	test('encodes the timestamp in the first 48 bits', () => {
		const now = Date.UTC(2030, 0, 1)
		expect(timestampOf(createUuidV7Generator(() => now)())).toBe(now)
	})

	test('ids within one millisecond are strictly increasing', () => {
		const generate = createUuidV7Generator(() => Date.UTC(2031, 0, 1))
		const ids = Array.from({ length: 1000 }, () => generate())
		expect([...ids].sort()).toEqual(ids)
		expect(new Set(ids).size).toBe(ids.length)
	})

	test('a clock going backwards does not break ordering', () => {
		let now = Date.UTC(2032, 0, 1)
		const generate = createUuidV7Generator(() => now)
		const first = generate()
		now -= 5000
		const second = generate()
		expect(second > first).toBe(true)
		expect(timestampOf(second)).toBe(Date.UTC(2032, 0, 1))
	})

	test('separate generators do not share state', () => {
		createUuidV7Generator(() => Date.UTC(2099, 0, 1))()
		expect(timestampOf(generateUuidV7())).toBeLessThan(Date.UTC(2099, 0, 1))
	})
})

describe('isUuid', () => {
	test.each([
		'00000000-0000-0000-0000-000000000000',
		'ffffffff-ffff-ffff-ffff-ffffffffffff',
		'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
		'6ba7b810-9dad-11d1-80b4-00c04fd430c8',
		'f47ac10b-58cc-4372-a567-0e02b2c3d479',
		'F47AC10B-58CC-4372-A567-0E02B2C3D479',
		'01890a5d-ac96-774b-bcce-b302099a8057',
	])('accepts %s', value => {
		expect(isUuid(value)).toBe(true)
	})

	test.each([
		'',
		'f47ac10b58cc4372a5670e02b2c3d479',
		'f47ac10b-58cc-0372-a567-0e02b2c3d479',
		'f47ac10b-58cc-9372-a567-0e02b2c3d479',
		'f47ac10b-58cc-4372-c567-0e02b2c3d479',
		'f47ac10b-58cc-4372-a567-0e02b2c3d47',
		' f47ac10b-58cc-4372-a567-0e02b2c3d479',
		'f47ac10b-58cc-4372-a567-0e02b2c3d479\n',
		'g47ac10b-58cc-4372-a567-0e02b2c3d479',
	])('rejects %p', value => {
		expect(isUuid(value)).toBe(false)
	})

	test('accepts generated ids', () => {
		expect(isUuid(generateUuidV4())).toBe(true)
		expect(isUuid(generateUuidV7())).toBe(true)
	})
})
