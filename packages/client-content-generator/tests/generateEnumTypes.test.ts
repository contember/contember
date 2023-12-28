import { describe, expect, test } from 'vitest'
import { EnumTypeSchemaGenerator } from '../src'


test('generate enums', () => {
	const enumGenerator = new EnumTypeSchemaGenerator()
	expect(enumGenerator.generate({
		entities: {},
		enums: {
			OrderStatus: ['new', 'paid', 'cancelled'],
			OrderType: ['normal', 'express'],
		},
	})).toMatchInlineSnapshot(`
		"export type OrderStatus = 
			 | "new"
			 | "paid"
			 | "cancelled"
		export type OrderType = 
			 | "normal"
			 | "express"
		"
	`)
})
