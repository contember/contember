import { expect, test } from 'bun:test'
import { Acl, Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { Authorizator } from '../../../src/acl/index.js'
import { EntityRulesResolver, IntrospectionSchemaFactory } from '../../../src/index.js'

test('ACL introspection omits unique constraints containing hidden fields', () => {
	const model = new SchemaBuilder()
		.entity('Item', entity =>
			entity
				.column('publicCode', column => column.type(Model.ColumnType.String))
				.column('secretTenantKey', column => column.type(Model.ColumnType.String))
				.unique(['publicCode', 'secretTenantKey']))
		.buildSchema()
	const permissions: Acl.Permissions = {
		Item: {
			predicates: {},
			operations: { read: { id: true, publicCode: true } },
		},
	}
	const introspection = new IntrospectionSchemaFactory(
		model,
		new EntityRulesResolver({}, model),
		new Authorizator(permissions, false, false),
	).create()
	expect(introspection.entities).toEqual([{
		name: 'Item',
		customPrimaryAllowed: false,
		fields: expect.any(Array),
		unique: [],
	}])
})
