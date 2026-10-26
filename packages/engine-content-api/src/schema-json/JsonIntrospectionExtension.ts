import { printSchema } from 'graphql'
import { buildSchema, Schema, TypeKind } from '@contember/graphql-json'
import introspectionSchema, { createSchemaConfig } from '../introspection/introspection.schema.js'
import { IntrospectionSchemaFactory } from '../introspection/index.js'
import { JsonSchemaExtension } from './JsonContentSchemaBuilder.js'
import { getCustomScalars } from './GraphQLJsBridge.js'

let introspectionTypes: Schema | undefined
const getIntrospectionTypes = (): Schema => {
	introspectionTypes ??= buildSchema(printSchema(introspectionSchema))
	return introspectionTypes
}

/** The `schema` query of the content API. Its types are static, so they are converted from graphql-js once. */
export const createJsonIntrospectionExtension = (introspectionSchemaFactory: IntrospectionSchemaFactory): JsonSchemaExtension => {
	const { q: queryTypeName, t: allTypes } = getIntrospectionTypes()
	const queryType = allTypes[queryTypeName]
	if (!queryType || queryType[0] !== TypeKind.OBJECT) {
		throw new Error('Introspection schema has no query type')
	}
	const schemaField = queryType[1].schema
	if (!schemaField) {
		throw new Error('Introspection schema has no schema field')
	}
	const types = Object.fromEntries(Object.entries(allTypes).filter(([name]) => name !== queryTypeName))
	return {
		types,
		includedTypes: (createSchemaConfig().types ?? []).map(it => it.name),
		scalars: getCustomScalars(introspectionSchema),
		queries: {
			schema: {
				type: schemaField[0],
				resolve: () => introspectionSchemaFactory.create(),
			},
		},
	}
}
