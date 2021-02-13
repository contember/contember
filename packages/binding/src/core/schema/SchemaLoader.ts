import { GraphQlClient } from '@contember/client'
import { RawSchema } from './RawSchema'
import { Schema } from './Schema'
import { SchemaPreprocessor } from './SchemaPreprocessor'

export class SchemaLoader {
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
		maxAttempts: number,
		options?: GraphQlClient.RequestOptions,
	): Promise<Schema> {
		return new Promise<Schema>(async (resolve, reject) => {
			for (let attemptNumber = 0; attemptNumber < Math.max(1, maxAttempts); attemptNumber++) {
				try {
					const raw: { data: { schema: RawSchema } } = await client.sendRequest(this.schemaQuery, options)
					const schema = new Schema(SchemaPreprocessor.processRawSchema(raw.data.schema))
					return resolve(schema)
				} catch {}
			}
			reject()
		})
	}
}
