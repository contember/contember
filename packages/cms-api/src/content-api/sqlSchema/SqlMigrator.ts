import { Model, assertNever } from 'cms-common'
import {
	SchemaDiff,
	CreateEntityModification,
	CreateColumnModification,
	Modification,
	RemoveEntityModification,
	RemoveFieldModification,
	UpdateEntityTableNameModification,
	UpdateColumnNameModification,
	UpdateColumnDefinitionModification,
	CreateUniqueConstraintModification,
	RemoveUniqueConstraintModification,
	CreateRelationModification,
	CreateEnumModification,
	RemoveEnumModification,
	UpdateEnumModification
} from '../../content-schema/differ/modifications'
import { MigrationBuilder } from 'node-pg-migrate'
import SchemaMigrator from '../../content-schema/differ/SchemaMigrator'
import { acceptFieldVisitor, acceptRelationTypeVisitor } from '../../content-schema/modelUtils'
import escapeSqlString from '../../utils/escapeSqlString'
import { createMigrationBuilder } from './sqlSchemaBuilderHelper'

export default class SqlMigrator {
	constructor(
		private readonly builder: MigrationBuilder,
		private readonly oldSchema: Model.Schema,
		private readonly newSchema: Model.Schema
	) {}

	public static applyDiff(oldSchema: Model.Schema, diff: SchemaDiff): string {
		const builder = createMigrationBuilder()
		const newSchema = SchemaMigrator.applyDiff(oldSchema, diff)
		const migrator = new SqlMigrator(builder, oldSchema, newSchema)
		for (const modification of diff.modifications) {
			migrator.apply(modification)
		}
		return builder.getSql()
	}

	public apply(modification: Modification) {
		switch (modification.modification) {
			case 'createEntity':
				this.createEntity(modification)
				break
			case 'removeEntity':
				this.removeEntity(modification)
				break
			case 'updateEntityTableName':
				this.updateEntityTableName(modification)
				break
			case 'createColumn':
				this.createColumn(modification)
				break
			case 'createRelation':
				this.createRelation(modification)
				break
			case 'removeField':
				this.removeField(modification)
				break
			case 'updateColumnName':
				this.updateColumnName(modification)
				break
			case 'updateColumnDefinition':
				this.updateColumnDefinition(modification)
				break
			case 'createUniqueConstraint':
				this.createUniqueConstraint(modification)
				break
			case 'removeUniqueConstraint':
				this.removeUniqueConstraint(modification)
				break
			case 'createEnum':
				this.createEnum(modification)
				break
			case 'removeEnum':
				this.removeEnum(modification)
				break
			case 'updateEnum':
				this.updateEnum(modification)
				break
			case 'updateEntityName':
			case 'updateEntityPluralName':
			case 'updateFieldName':
			case 'createRelationInverseSide':
				break
			default:
				assertNever(modification)
		}
	}

	private createEntity(modification: CreateEntityModification) {
		const entity = modification.entity
		const primaryColumn = entity.fields[entity.primary] as Model.AnyColumn
		this.builder.createTable(entity.tableName, {
			[primaryColumn.name]: {
				primaryKey: true,
				type: primaryColumn.type === Model.ColumnType.Enum ? `"${primaryColumn.columnType}"` : primaryColumn.columnType,
				notNull: true
			}
		})
	}

	private removeEntity(modification: RemoveEntityModification) {
		const entity = this.getOldEntity(modification.entityName)
		this.builder.dropTable(entity.tableName)
	}

	private updateEntityTableName(modification: UpdateEntityTableNameModification) {
		const entity = this.getNewEntity(modification.entityName)
		this.builder.renameTable(entity.tableName, modification.tableName)
	}

	private createColumn(modification: CreateColumnModification) {
		const entity = this.getNewEntity(modification.entityName)
		const column = modification.field
		this.builder.addColumn(entity.tableName, {
			[column.columnName]: {
				type: column.type === Model.ColumnType.Enum ? `"${column.columnType}"` : column.columnType,
				notNull: !column.nullable
			}
		})
	}

	private createRelation(modification: CreateRelationModification) {
		const entity = this.getNewEntity(modification.entityName)
		const targetEntity = this.getNewEntity(modification.owningSide.target)
		acceptRelationTypeVisitor(this.newSchema, entity, modification.owningSide, {
			visitManyHasOne: ({}, relation, {}, _) => {
				this.builder.addColumn(entity.tableName, {
					[relation.joiningColumn.columnName]: {
						type: this.getPrimaryType(targetEntity),
						notNull: !relation.nullable,
						references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
						onDelete: relation.joiningColumn.onDelete
					}
				})
				this.builder.addIndex(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwner: ({}, relation, {}, _) => {
				this.builder.addColumn(entity.tableName, {
					[relation.joiningColumn.columnName]: {
						type: this.getPrimaryType(targetEntity),
						notNull: !relation.nullable,
						unique: true,
						references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
						onDelete: relation.joiningColumn.onDelete
					}
				})
			},
			visitOneHasOneInversed: () => {},
			visitManyHasManyOwner: ({}, relation, {}, _) => {
				this.builder.createTable(
					relation.joiningTable.tableName,
					{
						[relation.joiningTable.joiningColumn.columnName]: {
							type: this.getPrimaryType(entity),
							notNull: true,
							references: `"${entity.tableName}"("${entity.primaryColumn}")`,
							onDelete: relation.joiningTable.joiningColumn.onDelete
						},
						[relation.joiningTable.inverseJoiningColumn.columnName]: {
							type: this.getPrimaryType(targetEntity),
							notNull: true,
							references: `"${targetEntity.tableName}"("${targetEntity.primaryColumn}")`,
							onDelete: relation.joiningTable.inverseJoiningColumn.onDelete
						}
					},
					{
						constraints: {
							primaryKey: [
								relation.joiningTable.joiningColumn.columnName,
								relation.joiningTable.inverseJoiningColumn.columnName
							]
						}
					}
				)
			},
			visitManyHasManyInversed: () => {}
		})
	}

	private removeField(modification: RemoveFieldModification) {
		acceptFieldVisitor(this.oldSchema, modification.entityName, modification.fieldName, {
			visitColumn: (entity, column) => {
				this.builder.dropColumn(entity.tableName, column.columnName)
			},
			visitManyHasOne: (entity, relation, {}, _) => {
				this.builder.dropColumn(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasMany: () => {},
			visitOneHasOneOwner: (entity, relation, {}, _) => {
				this.builder.dropColumn(entity.tableName, relation.joiningColumn.columnName)
			},
			visitOneHasOneInversed: () => {},
			visitManyHasManyOwner: ({}, relation, {}, _) => {
				this.builder.dropTable(relation.joiningTable.tableName)
			},
			visitManyHasManyInversed: () => {}
		})
	}

	private updateColumnName(modification: UpdateColumnNameModification) {
		const entity = this.getNewEntity(modification.entityName)
		const field = entity.fields[modification.fieldName] as Model.AnyColumn
		this.builder.renameColumn(entity.tableName, field.columnName, modification.columnName)
	}

	private updateColumnDefinition(modification: UpdateColumnDefinitionModification) {
		const entity = this.getNewEntity(modification.entityName)
		const field = entity.fields[modification.fieldName] as Model.AnyColumn
		this.builder.alterColumn(entity.tableName, field.columnName, {
			type: modification.definition.columnType,
			default: modification.definition.default,
			allowNull: modification.definition.nullable
		})
	}

	private createUniqueConstraint(modification: CreateUniqueConstraintModification) {
		const entity = this.getNewEntity(modification.entityName)
		const columns = modification.unique.fields.map(fieldName => {
			return acceptFieldVisitor(this.newSchema, entity, fieldName, {
				visitColumn: ({}, column) => {
					return column.columnName
				},
				visitManyHasOne: ({}, relation) => {
					return relation.joiningColumn.columnName
				},
				visitOneHasMany: () => {
					throw new Error('Cannot create unique key on 1:m relation')
				},
				visitOneHasOneOwner: () => {
					throw new Error('Cannot create unique key on 1:1 relation, this relation has unique key by default')
				},
				visitOneHasOneInversed: () => {
					throw new Error('Cannot create unique key on 1:1 inversed relation')
				},
				visitManyHasManyOwner: () => {
					throw new Error('Cannot create unique key on m:m relation')
				},
				visitManyHasManyInversed: () => {
					throw new Error('Cannot create unique key on m:m inversed relation')
				}
			})
		})
		this.builder.addConstraint(entity.tableName, modification.unique.name, { unique: columns })
	}

	private removeUniqueConstraint(modification: RemoveUniqueConstraintModification) {
		const entity = this.getNewEntity(modification.entityName)
		this.builder.dropConstraint(entity.tableName, modification.constraintName)
	}

	private createEnum(modification: CreateEnumModification) {
		const joinedValues = modification.values.map(it => `'${escapeSqlString(it)}'`).join(',')
		this.builder.createDomain(modification.enumName, 'text', { check: `VALUE IN(${joinedValues})` })
	}

	private removeEnum(modification: RemoveEnumModification) {
		this.builder.dropDomain(modification.enumName)
	}

	private updateEnum(modification: UpdateEnumModification) {
		const joinedValues = modification.values.map(it => `'${escapeSqlString(it)}'`).join(',')
		this.builder.alterDomain(modification.enumName, { check: `VALUE IN(${joinedValues})` })
	}

	private getOldEntity(name: string): Model.Entity {
		return this.oldSchema.entities[name]
	}

	private getNewEntity(name: string): Model.Entity {
		return this.newSchema.entities[name]
	}

	private getPrimaryType(entity: Model.Entity): string {
		const column = entity.fields[entity.primary] as Model.AnyColumn
		return column.columnType
	}
}
