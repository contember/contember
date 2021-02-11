import { RawSchema } from './RawSchema'
import { RawSchemaEntity, RawSchemaFields } from './RawSchemaEntity'
import { RawSchemaEnum } from './RawSchemaEnum'
import { Schema, SchemaEntities } from './Schema'
import { SchemaFields } from './SchemaEntity'
import { SchemaEnums } from './SchemaEnums'

export class SchemaPreprocessor {
	public static processRawSchema(rawSchema: RawSchema): Schema {
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
				unique: entity.unique,
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
