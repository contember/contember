import { describe, expect, test } from 'bun:test'
import { EnumTypeSchemaGenerator } from '../src'


test('generate enums', () => {
	const enumGenerator = new EnumTypeSchemaGenerator()
	expect(enumGenerator.generate({
		entities: {},
		enums: {
			OrderStatus: ['new', 'paid', 'cancelled'],
			orderType: ['normal', 'express'],
		},
	})).toMatchSnapshot()
})
