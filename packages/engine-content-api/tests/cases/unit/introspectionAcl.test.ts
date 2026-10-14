import { expect, test } from 'bun:test'
import { Acl, Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { Authorizator } from '../../../src/acl/index.js'
import { EntityRulesResolver, IntrospectionSchemaFactory } from '../../../src/index.js'

const model = new SchemaBuilder()
	.entity('Item', entity =>
		entity
			.column('code', column => column.type(Model.ColumnType.String))
			.column('tenantKey', column => column.type(Model.ColumnType.String))
			.unique(['code'])
			.unique(['code', 'tenantKey']))
	.buildSchema()

const introspect = (permissions: Acl.Permissions) =>
	new IntrospectionSchemaFactory(model, new EntityRulesResolver({}, model), new Authorizator(permissions, false, false)).create()

test('introspection omits a unique constraint over a field the role cannot read', () => {
	const introspection = introspect({ Item: { predicates: {}, operations: { read: { id: true, code: true } } } })

	expect(introspection.entities[0].fields.map(it => it.name)).toEqual(['id', 'code'])
	expect(introspection.entities[0].unique).toEqual([{ fields: ['code'] }])
})

test('introspection lists a unique constraint over readable fields', () => {
	const introspection = introspect({ Item: { predicates: {}, operations: { read: { id: true, code: true, tenantKey: true } } } })

	expect(introspection.entities[0].unique).toEqual([{ fields: ['code'] }, { fields: ['code', 'tenantKey'] }])
})
