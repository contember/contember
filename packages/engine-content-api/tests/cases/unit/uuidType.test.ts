import { describe, it, expect } from 'vitest'
import { CustomTypesProvider } from '../../../src'

describe('uuid graphql type', () => {

	const customTypesProvider = new CustomTypesProvider()
	it('accepts valid uuid', () => {
		const validUuid = 'e0818cf9-eee3-4452-9a13-031435218473'
		expect(customTypesProvider.uuidType.parseValue(validUuid)).eq(validUuid)
	})

	it('accepts valid uuid without dashes', () => {
		const validUuid = 'e0818cf9eee344529a13031435218473'
		expect(customTypesProvider.uuidType.parseValue(validUuid)).eq(validUuid)
	})

	it('declines invalid uuid', () => {
		const invalidUuid = '818cf9-eee3-4452-9a13-031435218473'
		expect(customTypesProvider.uuidType.parseValue(invalidUuid)).eq(undefined)
	})

	it('declines not-string', () => {
		expect(customTypesProvider.uuidType.parseValue(1)).eq(undefined)
	})
})
