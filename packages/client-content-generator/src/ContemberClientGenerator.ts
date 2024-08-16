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

		const namesCode = `import { SchemaNames } from '@contember/client-content'
export const ContemberClientNames: SchemaNames = ` + JSON.stringify(nameSchema, null, 2)

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
