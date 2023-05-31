import { Model, Schema, Writable } from '@contember/schema'
import { LaxSchema, LaxSchemaColumn, LaxSchemaEnum, LaxSchemaField, LaxSchemaRelation } from './schema'
import { DefaultNamingConventions, NamingConventions, resolveDefaultColumnType } from '../model'
import { emptySchema } from '../index'

const simpleColumnTypes: { [K in LaxSchemaColumn['type']]: { type: Model.ColumnType; columnType: string } } = {
	boolean: { type: Model.ColumnType.Bool, columnType: 'boolean' },
	int: { type: Model.ColumnType.Int, columnType: 'integer' },
	date: { type: Model.ColumnType.Date, columnType: 'date' },
	datetime: { type: Model.ColumnType.DateTime, columnType: 'timestamptz' },
	float: { type: Model.ColumnType.Double, columnType: 'double precision' },
	json: { type: Model.ColumnType.Json, columnType: 'jsonb' },
	string: { type: Model.ColumnType.String, columnType: 'text' },
}

const isColumnDefinition = (field: LaxSchemaField): field is LaxSchemaColumn => field.type in simpleColumnTypes

export class LaxSchemaConverter {
	constructor(
		private readonly schema: LaxSchema,
		private readonly conventions: NamingConventions = new DefaultNamingConventions(),
	) {
	}

	public convert(): Schema {
		const builder = new LaxSchemaBuilder(this.schema, this.conventions)
		return builder.build()
	}

}

class LaxSchemaBuilder {
	private readonly entities: Record<string, Model.Entity> = {}
	private readonly enums: Record<string, string[]> = {}

	constructor(
		private readonly schema: LaxSchema,
		private readonly conventions: NamingConventions = new DefaultNamingConventions(),
	) {
	}

	public build(): Schema {
		for (const [entityName, entityDefinition] of Object.entries(this.schema.entities)) {
			for (const [fieldName, fieldDefinition] of Object.entries(entityDefinition.fields)) {
				if (isColumnDefinition(fieldDefinition)) {
					this.processColumn(entityName, fieldName, fieldDefinition)

				} else if (fieldDefinition.type === 'enum') {
					this.processEnum(entityName, fieldName, fieldDefinition)

				} else {
					this.processRelation(entityName, fieldName, fieldDefinition)
				}
			}
		}
		return {
			...emptySchema,
			model: {
				enums: this.enums,
				entities: this.entities,
			},
		}
	}

	private processColumn(entityName: string, fieldName: string, columnDef: LaxSchemaColumn) {
		const columnName = this.conventions.getColumnName(fieldName)
		this.registerField(entityName, {
			name: fieldName,
			columnName: columnName,
			type: simpleColumnTypes[columnDef.type].type,
			nullable: !columnDef.notNull,
			columnType: simpleColumnTypes[columnDef.type].columnType,
		})
	}

	private processEnum(entityName: string, fieldName: string, enumDef: LaxSchemaEnum) {
		this.enums[enumDef.enumName] = Array.from(new Set([...this.enums[enumDef.enumName] ?? [], ...enumDef.values]))
		const columnName = this.conventions.getColumnName(fieldName)
		this.registerField(entityName, {
			name: fieldName,
			columnName: columnName,
			type: Model.ColumnType.Enum,
			nullable: !enumDef.notNull,
			columnType: enumDef.enumName,
		})
	}

	private processRelation(entityName: string, fieldName: string, relDef: LaxSchemaRelation) {
		switch (relDef.type) {
			case 'manyHasMany':
				const joiningColumns = this.conventions.getJoiningTableColumnNames(entityName, fieldName, relDef.targetEntity, relDef.targetField)
				this.registerField(entityName, {
					type: Model.RelationType.ManyHasMany,
					name: fieldName,
					target: relDef.targetEntity,
					inversedBy: relDef.targetField,
					joiningTable: {
						tableName: this.conventions.getJoiningTableName(entityName, fieldName),
						joiningColumn: {
							columnName: joiningColumns[0],
							onDelete: Model.OnDelete.cascade,
						},
						inverseJoiningColumn: {
							columnName: joiningColumns[1],
							onDelete: Model.OnDelete.cascade,
						},
						eventLog: { enabled: true },
					},
				})
				if (!this.schema.entities[relDef.targetEntity].fields[relDef.targetField]) {
					this.processRelation(relDef.targetEntity, relDef.targetField, {
						type: 'manyHasManyInverse',
						targetEntity: entityName,
						targetField: fieldName,
					})
				}
				break
			case 'manyHasManyInverse':
				this.registerField(entityName, {
					type: Model.RelationType.ManyHasMany,
					name: fieldName,
					target: relDef.targetEntity,
					ownedBy: relDef.targetField,
				})
				break
			case 'manyHasOne':
				this.registerField(entityName, {
					type: Model.RelationType.ManyHasOne,
					name: fieldName,
					target: relDef.targetEntity,
					inversedBy: relDef.targetField,
					joiningColumn: {
						columnName: this.conventions.getJoiningColumnName(fieldName),
						onDelete: Model.OnDelete.restrict,
					},
					nullable: !relDef.notNull,
				})
				if (!this.schema.entities[relDef.targetEntity].fields[relDef.targetField]) {
					this.processRelation(relDef.targetEntity, relDef.targetField, {
						type: 'oneHasMany',
						targetEntity: entityName,
						targetField: fieldName,
					})
				}
				break
			case 'oneHasMany':
				this.registerField(entityName, {
					type: Model.RelationType.OneHasMany,
					name: fieldName,
					target: relDef.targetEntity,
					ownedBy: relDef.targetField,
				})
				break
			case 'oneHasOne':
				this.registerField(entityName, {
					type: Model.RelationType.OneHasOne,
					name: fieldName,
					target: relDef.targetEntity,
					inversedBy: relDef.targetField,
					joiningColumn: {
						columnName: this.conventions.getJoiningColumnName(fieldName),
						onDelete: Model.OnDelete.restrict,
					},
					nullable: !relDef.notNull,
				})
				if (!this.schema.entities[relDef.targetEntity].fields[relDef.targetField]) {
					this.processRelation(relDef.targetEntity, relDef.targetField, {
						type: 'oneHasOneInverse',
						targetEntity: entityName,
						targetField: fieldName,
					})
				}
				break
			case 'oneHasOneInverse':
				this.registerField(entityName, {
					type: Model.RelationType.OneHasOne,
					name: fieldName,
					target: relDef.targetEntity,
					ownedBy: relDef.targetField,
					nullable: !relDef.notNull,
				})
				break
		}
	}

	private registerField(entityName: string, field: Model.AnyField) {
		const entity = this.getEntity(entityName)
		;(entity.fields as Writable<Model.Entity['fields']>)[field.name] = field
	}


	private getEntity(entityName: string): Model.Entity {
		return this.entities[entityName] ??= {
			name: entityName,
			unique: [],
			indexes: [],
			primary: 'id',
			primaryColumn: 'id',
			tableName: this.conventions.getTableName(entityName),
			eventLog: { enabled: true },
			fields: {
				id: {
					name: 'id',
					columnName: 'id',
					type: Model.ColumnType.Uuid,
					columnType: resolveDefaultColumnType(Model.ColumnType.Uuid),
					nullable: false,
				},
			},
		}
	}
}
