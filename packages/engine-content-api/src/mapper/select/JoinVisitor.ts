import { Model } from '@contember/schema'
import { Path } from './Path'

export class JoinVisitor implements Model.RelationByTypeVisitor<JoinDefinition[]> {
	constructor(private readonly path: Path) {}

	visitOneHasOneOwning({ targetEntity, relation }: Model.OneHasOneOwningContext): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: relation.joiningColumn.columnName,
				targetColumn: targetEntity.primaryColumn,
			},
		]
	}

	visitOneHasOneInverse({ targetEntity, entity, targetRelation }: Model.OneHasOneInverseContext): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: entity.primaryColumn,
				targetColumn: targetRelation.joiningColumn.columnName,
			},
		]
	}

	visitManyHasOne({ targetEntity, relation }: Model.ManyHasOneContext): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: relation.joiningColumn.columnName,
				targetColumn: targetEntity.primaryColumn,
			},
		]
	}

	visitOneHasMany({ targetEntity, targetRelation, entity }: Model.OneHasManyContext): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: entity.primaryColumn,
				targetColumn: targetRelation.joiningColumn.columnName,
				many: true,
			},
		]
	}

	visitManyHasManyOwning({ relation, entity, targetEntity }: Model.ManyHasManyOwningContext): JoinDefinition[] {
		const sourceAlias = this.path.back().alias
		const targetAlias = this.path.alias
		const joiningAlias = this.path.back().for('x_' + this.path.alias).alias
		return [
			{
				tableName: relation.joiningTable.tableName,
				sourceAlias: sourceAlias,
				targetAlias: joiningAlias,
				sourceColumn: entity.primaryColumn,
				targetColumn: relation.joiningTable.joiningColumn.columnName,
				many: true,
			},
			{
				tableName: targetEntity.tableName,
				sourceAlias: joiningAlias,
				targetAlias: targetAlias,
				sourceColumn: relation.joiningTable.inverseJoiningColumn.columnName,
				targetColumn: targetEntity.primaryColumn,
			},
		]
	}

	visitManyHasManyInverse({ targetRelation, entity, targetEntity }: Model.ManyHasManyInverseContext): JoinDefinition[] {
		const sourceAlias = this.path.back().alias
		const targetAlias = this.path.alias
		const joiningAlias = this.path.back().for('x_' + this.path.alias).alias
		return [
			{
				tableName: targetRelation.joiningTable.tableName,
				sourceAlias: sourceAlias,
				targetAlias: joiningAlias,
				sourceColumn: entity.primaryColumn,
				targetColumn: targetRelation.joiningTable.inverseJoiningColumn.columnName,
				many: true,
			},
			{
				tableName: targetEntity.tableName,
				sourceAlias: joiningAlias,
				targetAlias: targetAlias,
				sourceColumn: targetRelation.joiningTable.joiningColumn.columnName,
				targetColumn: targetEntity.primaryColumn,
			},
		]
	}
}

export interface JoinDefinition {
	sourceAlias?: string
	targetAlias?: string
	tableName: string
	sourceColumn: string
	targetColumn: string
	many?: true
}
