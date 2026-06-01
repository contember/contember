import type { RawSchema } from './RawSchema.js'
import type { RawSchemaEntity, RawSchemaFields } from './RawSchemaEntity.js'
import type { RawSchemaEnum } from './RawSchemaEnum.js'
import type { SchemaEntities } from './SchemaEntities.js'
import type { SchemaEnums } from './SchemaEnums.js'
import type { SchemaFields } from './SchemaFields.js'
import type { SchemaStore } from './SchemaStore.js'

export class SchemaPreprocessor {
	public static processRawSchema(rawSchema: RawSchema): SchemaStore {
		return {
			enums: this.processRawEnums(rawSchema.enums),
			entities: this.processRawEntities(rawSchema.entities),
		}
	}

	private static processRawEnums(rawEnums: RawSchemaEnum[]): SchemaEnums {
		const enums: SchemaEnums = new Map()

		for (const { name, values } of rawEnums) {
			enums.set(name, new Set(values))
		}

		return enums
	}

	private static processRawEntities(rawEntities: RawSchemaEntity[]): SchemaEntities {
		const entities: SchemaEntities = new Map()

		for (const entity of rawEntities) {
			entities.set(entity.name, {
				customPrimaryAllowed: entity.customPrimaryAllowed,
				fields: this.processRawFields(entity.fields),
				name: entity.name,
				unique: entity.unique.map(it => ({ fields: new Set(it.fields) })),
			})
		}

		return entities
	}

	private static processRawFields(rawFields: RawSchemaFields): SchemaFields {
		const fields: SchemaFields = new Map()

		for (const field of rawFields) {
			fields.set(field.name, field)
		}

		return fields
	}
}
