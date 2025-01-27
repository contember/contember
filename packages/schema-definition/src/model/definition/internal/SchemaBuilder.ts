import { Model } from '@contember/schema'
import { NamingConventions } from '@contember/schema-utils'
import 'reflect-metadata'
import { tuple } from '../../../utils'
import { EntityConstructor, FieldsDefinition } from '../types'
import { EnumDefinition } from '../EnumDefinition'
import { EntityRegistry } from './EntityRegistry'
import { EnumRegistry } from './EnumRegistry'
import { ColumnDefinition } from '../fieldDefinitions'
import { applyEntityExtensions } from '../extensions'
import { StrictOptions, StrictDefinitionValidator } from '../../../strict'

export class SchemaBuilder {
	private entityRegistry = new EntityRegistry()

	private enumRegistry = new EnumRegistry()

	constructor(
		private readonly conventions: NamingConventions,
		private readonly strictDefinitionValidator: StrictDefinitionValidator = new StrictDefinitionValidator({}),
	) {}

	public addEntity(name: string, entity: EntityConstructor): void {
		this.entityRegistry.register(name, entity)
	}

	public addEnum(name: string, definition: EnumDefinition): void {
		this.enumRegistry.register(name, definition)
	}

	public createSchema(): Model.Schema {
		const entities = Object.entries(this.entityRegistry.entities).map(([entityName, definition]): Model.Entity => {
			const definitionInstance: FieldsDefinition = new definition()

			Object.entries(definitionInstance).forEach(([fieldName, fieldDefinition]) => {
				if (typeof fieldDefinition !== 'object' || !('createField' in fieldDefinition)) {
					throw `Entity "${entityName}": field "${fieldName}" does not contain expected field definition. Check that you are correctly invoking methods of the definition builder.`
				}
			})

			const primaryName = this.conventions.getPrimaryField()

			const fields: Model.Entity['fields'] = [
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
						strictDefinitionValidator: this.strictDefinitionValidator,
					})
				})
				.reduce<Model.Entity['fields']>((acc, field) => {
					if (acc[field.name]) {
						throw new Error(`Entity ${entityName}: field ${field.name} is already registered`)
					}
					return { ...acc, [field.name]: field }
				}, {})


			const entity: Model.Entity = {
				name: entityName,
				primary: primaryName,
				primaryColumn: (fields[primaryName] as Model.AnyColumn).columnName,
				unique: this.createUnique(entityName, definitionInstance),
				indexes: [],
				fields: fields,
				tableName: this.conventions.getTableName(entityName),
				eventLog: {
					enabled: true,
				},
			}
			return applyEntityExtensions(definition, {
				entity,
				definition: definitionInstance,
				registry: this.entityRegistry,
				entityRegistry: this.entityRegistry,
				conventions: this.conventions,
				enumRegistry: this.enumRegistry,
				strictDefinitionValidator: this.strictDefinitionValidator,
			})
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
		const unique: Model.UniqueConstraint[] = []
		for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
			if (definition.options.unique) {
				unique.push({ fields: [fieldName], ...definition.options.unique })
			}
		}
		return unique
	}
}
