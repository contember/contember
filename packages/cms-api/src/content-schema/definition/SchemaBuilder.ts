import { Model } from 'cms-common'
import NamingConventions from './NamingConventions'
import FieldDefinition from './FieldDefinition'
import SqlNameHelper from '../../content-api/sqlSchema/SqlNameHelper'
import UniqueDefinition from './UniqueDefinition'
import { EntityConstructor, EntityType } from './types'
import ColumnDefinition from './ColumnDefinition'
import EnumDefinition from './EnumDefinition'
import 'reflect-metadata'
import { tuple } from '../../utils/tuple'
import { Interface } from '../../utils/interfaceType'

class SchemaBuilder {
	private entityRegistry = new SchemaBuilder.EntityRegistry()

	private enumRegistry = new SchemaBuilder.EnumRegistry()

	constructor(private readonly conventions: NamingConventions) {}

	public addEntity(name: string, entity: EntityConstructor<any>): void {
		this.entityRegistry.register(name, entity)
	}

	public addEnum(name: string, definition: EnumDefinition): void {
		this.enumRegistry.register(name, definition)
	}

	public createSchema(): Model.Schema {
		const entities = Object.entries(this.entityRegistry.entities).map(
			([entityName, definition]): Model.Entity => {
				const definitionInstance = new definition()

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
			},
		)

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

	private createUnique(
		entityName: string,
		uniqueDefinition: UniqueDefinition.Options[],
		fieldDefinitions: Record<string, Interface<FieldDefinition<any>>>,
	): Model.UniqueConstraints {
		const unique: Model.UniqueConstraints = {}
		for (let { name, fields } of uniqueDefinition) {
			name = name || SqlNameHelper.createUniqueConstraintName(entityName, fields)
			unique[name] = { fields, name }
		}
		for (const [fieldName, definition] of Object.entries(fieldDefinitions)) {
			if (definition.options.unique) {
				const uniqueName = SqlNameHelper.createUniqueConstraintName(entityName, [fieldName])
				unique[uniqueName] = { fields: [fieldName], name: uniqueName }
			}
		}
		return unique
	}
}

namespace SchemaBuilder {
	export class EnumRegistry {
		public readonly enums: Record<string, EnumDefinition> = {}

		register(name: string, definition: EnumDefinition) {
			if (this.enums[name]) {
				throw new Error(`Enum with name ${name} is already registered`)
			}
			this.enums[name] = definition
		}

		has(definition: EnumDefinition): boolean {
			return Object.values(this.enums).includes(definition)
		}

		getName(definition: EnumDefinition): string {
			for (const [name, def] of Object.entries(this.enums)) {
				if (def === definition) {
					return name
				}
			}
			throw new Error(`Enum with values ${definition.values.join(', ')} is not registered.`)
		}
	}

	export class EntityRegistry {
		public readonly entities: Record<string, EntityConstructor<EntityType<any>>> = {}

		register(name: string, definition: EntityConstructor<EntityType<any>>) {
			if (this.entities[name]) {
				throw new Error(`Entity with name ${name} is already registered`)
			}
			this.entities[name] = definition
		}

		has(definition: EntityConstructor<EntityType<any>>): boolean {
			return Object.values(this.entities).includes(definition)
		}

		getName(definition: EntityConstructor<EntityType<any>>): string {
			for (const [name, def] of Object.entries(this.entities)) {
				if (def === definition) {
					return name
				}
			}
			throw new Error(`Entity ${definition.name} is not registered. Have you exported the definition?`)
		}
	}
}

export default SchemaBuilder
