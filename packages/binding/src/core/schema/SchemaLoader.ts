import type { GraphQlClient, GraphQlClientRequestOptions } from '@contember/client'
import type { RawSchema } from './RawSchema'
import { Schema } from './Schema'
import { SchemaPreprocessor } from './SchemaPreprocessor'

export class SchemaLoader {
	private static readonly schemaLoadCache: Map<string, Promise<Schema>> = new Map()

	private static readonly schemaQuery =
		'query {\n' +
		'  schema {\n' +
		'    enums {\n' +
		'      name\n' +
		'      values\n' +
		'    }\n' +
		'    entities {\n' +
		'      name\n' +
		'      customPrimaryAllowed\n' +
		'      unique {\n' +
		'        fields\n' +
		'      }\n' +
		'      fields {\n' +
		'        __typename\n' +
		'        name\n' +
		'        type\n' +
		'        nullable\n' +
		'        ... on _Column {\n' +
		'          enumName\n' +
		'          defaultValue\n' +
		'        }\n' +
		'        ... on _Relation {\n' +
		'          side\n' +
		'          targetEntity\n' +
		'          ownedBy\n' +
		'          inversedBy\n' +
		'          onDelete\n' +
		'          orphanRemoval\n' +
		'          orderBy {\n' +
		'            path\n' +
		'            direction\n' +
		'          }\n' +
		'        }\n' +
		'      }\n' +
		'    }\n' +
		'  }\n' +
		'}'

	public static async loadSchema(
		client: GraphQlClient,
		options?: GraphQlClientRequestOptions,
	): Promise<Schema> {

		const existing = this.schemaLoadCache.get(client.apiUrl)
		if (existing !== undefined) {
			return existing
		}
		const schemaPromise = (async () => {
			const raw: { data: { schema: RawSchema } } = await client.sendRequest(this.schemaQuery, options)
			return new Schema(SchemaPreprocessor.processRawSchema(raw.data.schema))
		})()
		this.schemaLoadCache.set(client.apiUrl, schemaPromise)
		return await schemaPromise
	}
}
