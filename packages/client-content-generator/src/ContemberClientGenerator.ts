import { Model } from '@contember/schema'
import { EnumTypeSchemaGenerator } from './EnumTypeSchemaGenerator'
import { EntityTypeSchemaGenerator } from './EntityTypeSchemaGenerator'
import { NameSchemaGenerator } from './NameSchemaGenerator'

export class ContemberClientGenerator {
	constructor(
		private readonly nameSchemaGenerator: NameSchemaGenerator = new NameSchemaGenerator(),
		private readonly enumTypeSchemaGenerator: EnumTypeSchemaGenerator = new EnumTypeSchemaGenerator(),
		private readonly entityTypeSchemaGenerator: EntityTypeSchemaGenerator = new EntityTypeSchemaGenerator(),
	) {
	}

	generate(model: Model.Schema): Record<string, string> {
		const nameSchema = this.nameSchemaGenerator.generate(model)
		const enumTypeSchema = this.enumTypeSchemaGenerator.generate(model)
		const entityTypeSchema = this.entityTypeSchemaGenerator.generate(model)

		const namesCode = `import type { SchemaNames, SchemaEntityNames } from '@contember/client-content'
import type { ContemberClientEntities } from './entities'
import type { ContemberClientEnums } from './enums'
export const ContemberClientNames = {
	entities: ${
			JSON.stringify(nameSchema.entities, null, '\t').replaceAll('\n', '\n\t')
		} satisfies {[K in keyof ContemberClientEntities]: SchemaEntityNames<K>},
	enums: ${
			JSON.stringify(nameSchema.enums, null, '\t').replaceAll('\n', '\n\t')
		} satisfies {[K in keyof ContemberClientEnums]: readonly ContemberClientEnums[K][]},
} satisfies SchemaNames`

		const indexCode = `
import { ContemberClientNames } from './names'
import type { ContemberClientSchema } from './entities'
import { ContentQueryBuilder, TypedContentQueryBuilder, TypedEntitySelection } from '@contember/client-content'
export * from './names'
export * from './enums'
export * from './entities'

export const queryBuilder = new ContentQueryBuilder(ContemberClientNames) as unknown as TypedContentQueryBuilder<ContemberClientSchema>

export type FragmentOf<EntityName extends keyof ContemberClientSchema['entities'] & string, Data = unknown> =
TypedEntitySelection<ContemberClientSchema, EntityName, ContemberClientSchema['entities'][EntityName], Data>

export type FragmentType<T extends TypedEntitySelection<any, any, any, any> = any> =
T extends TypedEntitySelection<any, any, any, infer TFields>
	? TFields
	: never
`
		return {
			'names.ts': namesCode,
			'enums.ts': enumTypeSchema,
			'entities.ts': entityTypeSchema,
			'index.ts': indexCode,
		}
	}
}
