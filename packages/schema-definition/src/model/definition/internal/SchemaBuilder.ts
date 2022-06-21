import { Model, Writable } from '@contember/schema'
import { NamingHelper } from '@contember/schema-utils'
import 'reflect-metadata'
import { tuple } from '../../../utils'
import { EntityConstructor, FieldsDefinition } from '../types'
import { NamingConventions } from '../NamingConventions'
import { EnumDefinition } from '../EnumDefinition'
import { EntityRegistry } from './EntityRegistry'
import { EnumRegistry } from './EnumRegistry'
import { ColumnDefinition } from '../fieldDefinitions'
import { applyEntityExtensions } from '../extensions'

export class SchemaBuilder {
	private entityRegistry = new EntityRegistry()

	private enumRegistry = new EnumRegistry()

	constructor(private readonly conventions: NamingConventions) {}

	public addEntity(name: string, entity: EntityConstructor): void {
		this.entityRegistry.register(name, entity)
	}

	public addEnum(name: string, definition: EnumDefinition): void {
		this.enumRegistry.register(name, definition)
	}

	public createSchema(): Model.Schema {
		const entities = Object.entries(this.entityRegistry.entities).map(([entityName, definition]): Model.Entity => {
			const definitionInstance: FieldsDefinition = new definition()

			const primaryName = this.conventions.getPrimaryField()

			const entity: Model.Entity = {
				name: entityName,
				primary: primaryName,
				primaryColumn: this.conventions.getColumnName(primaryName),
				unique: this.createUnique(entityName, definitionInstance),
				indexes: {},
				fields: [
					...definitionInstance[primaryName] ? [] : [tuple(primaryName, this.createPrimaryColumn())],
					...Object.entries(definitionInstance),
				]
					.map(([name, definition]) => {
						return definition.createField({
							name,
							entityName,
							conventions: this.conventions,
							enumRegistry: this.enumRegistry,
							entityRegistry: this.entityRegistry,
						})
					})
					.reduce<Model.Entity['fields']>((acc, field) => {
						if (acc[field.name]) {
							throw new Error(`Entity ${entityName}: field ${field.name} is already registered`)
						}
						return { ...acc, [field.name]: field }
					}, {}),
				tableName: this.conventions.getTableName(entityName),
				eventLog: {
					enabled: true,
				},
			}
			return applyEntityExtensions(definition, { entity,  definition: definitionInstance, registry: this.entityRegistry })
		})

		return {
			enums: Object.entries(this.enumRegistry.enums).reduce((acc, [name, def]) => ({ ...acc, [name]: def.values }), {}),
			entities: entities.reduce((acc, entity) => ({ ...acc, [entity.name]: entity }), {}),
		}
	}

	private createPrimaryColumn(): ColumnDefinition {
		return new ColumnDefinition({
			nullable: false,
			type: Model.ColumnType.Uuid,
		})
	}

	private createUnique(entityName: string, fieldDefinitions: FieldsDefinition): Model.UniqueConstraints {
		const unique: Writable<Model.UniqueConstraints> = {}
		for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
			if (definition.options.unique) {
				const uniqueName = NamingHelper.createUniqueConstraintName(entityName, [fieldName])
				unique[uniqueName] = { fields: [fieldName], name: uniqueName }
			}
		}
		return unique
	}
}
