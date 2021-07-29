import { Model } from '@contember/schema'
import { NamingHelper } from '@contember/schema-utils'
import 'reflect-metadata'
import { tuple } from '../../../utils'
import { EntityConstructor, Interface } from '../types'
import { NamingConventions } from '../NamingConventions'
import { EnumDefinition } from '../EnumDefinition'
import { EntityRegistry } from './EntityRegistry'
import { EnumRegistry } from './EnumRegistry'
import { ColumnDefinition, FieldDefinition } from '../fieldDefinitions'
import { UniqueOptions } from '../UniqueDefinition'

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
			const definitionInstance: Record<string, Interface<FieldDefinition<any>>> = new definition()

			const unique = Reflect.getMetadata('uniqueKeys', definition) || []

			const primaryName = this.conventions.getPrimaryField()
			const primaryField = this.createPrimaryColumn()

			return {
				name: entityName,
				primary: primaryName,
				primaryColumn: this.conventions.getColumnName(primaryName),
				unique: this.createUnique(entityName, unique, definitionInstance),
				fields: [tuple(primaryName, primaryField), ...Object.entries(definitionInstance)]
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
			}
		})

		return {
			enums: Object.entries(this.enumRegistry.enums).reduce((acc, [name, def]) => ({ ...acc, [name]: def.values }), {}),
			entities: entities.reduce((acc, entity) => ({ ...acc, [entity.name]: entity }), {}),
		}
	}

	private createPrimaryColumn(): ColumnDefinition<Model.ColumnType.Uuid> {
		return new ColumnDefinition({
			nullable: false,
			type: Model.ColumnType.Uuid,
		})
	}

	private createUnique(
		entityName: string,
		uniqueDefinition: UniqueOptions<Record<string, unknown>>[],
		fieldDefinitions: Record<string, Interface<FieldDefinition<any>>>,
	): Model.UniqueConstraints {
		const unique: Model.UniqueConstraints = {}
		for (let { name, fields } of uniqueDefinition) {
			name = name || NamingHelper.createUniqueConstraintName(entityName, fields)
			unique[name] = { fields, name }
		}
		for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
			if (definition.options.unique) {
				const uniqueName = NamingHelper.createUniqueConstraintName(entityName, [fieldName])
				unique[uniqueName] = { fields: [fieldName], name: uniqueName }
			}
		}
		return unique
	}
}
