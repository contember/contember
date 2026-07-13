import { expect, test } from 'bun:test'
import { Acl, Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { isObjectType } from 'graphql'
import { Authorizator } from '../../../src/acl/index.js'
import { GraphQlSchemaBuilderFactory } from '../../../src/schema/index.js'

const model = new SchemaBuilder()
	.entity('Item', entity => entity.column('name', column => column.type(Model.ColumnType.String).notNull()))
	.buildSchema()

const permissions = (readName: boolean): Acl.Permissions => ({
	Item: {
		predicates: {},
		operations: { read: readName ? { id: true, name: true } : { id: true } },
	},
})

const getNameType = (rootPermissions: Acl.Permissions): string => {
	const allPermissions = permissions(true)
	const schema = new GraphQlSchemaBuilderFactory()
		.create(model, new Authorizator(allPermissions, false, false, rootPermissions))
		.build()
	const item = schema.getType('Item')
	if (!item || !isObjectType(item)) {
		throw new Error('Item object type is missing')
	}
	return item.getFields().name.type.toString()
}

test('through-only non-null field is nullable in a shared output type', () => {
	expect(getNameType(permissions(false))).toBe('String')
})

test('field stays non-null when both root and through contexts guarantee it', () => {
	expect(getNameType(permissions(true))).toBe('String!')
})
