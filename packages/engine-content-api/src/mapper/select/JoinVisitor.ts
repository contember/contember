import { Model } from '@contember/schema'
import { Path } from './Path'

export class JoinVisitor implements Model.RelationByTypeVisitor<JoinDefinition[]> {
	constructor(private readonly path: Path) {}

	visitOneHasOneOwning(
		entity: Model.Entity,
		relation: Model.OneHasOneOwningRelation,
		targetEntity: Model.Entity,
	): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: relation.joiningColumn.columnName,
				targetColumn: targetEntity.primaryColumn,
			},
		]
	}

	visitOneHasOneInverse(
		entity: Model.Entity,
		relation: Model.OneHasOneInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwningRelation,
	): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: entity.primaryColumn,
				targetColumn: targetRelation.joiningColumn.columnName,
			},
		]
	}

	visitManyHasOne(
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation,
		targetEntity: Model.Entity,
	): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: relation.joiningColumn.columnName,
				targetColumn: targetEntity.primaryColumn,
			},
		]
	}

	visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): JoinDefinition[] {
		return [
			{
				tableName: targetEntity.tableName,
				sourceColumn: entity.primaryColumn,
				targetColumn: targetRelation.joiningColumn.columnName,
				many: true,
			},
		]
	}

	visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
	): JoinDefinition[] {
		const sourceAlias = this.path.back().getAlias()
		const targetAlias = this.path.getAlias()
		const joiningAlias = `${sourceAlias}_x_${targetAlias}`
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

	visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): JoinDefinition[] {
		const sourceAlias = this.path.back().getAlias()
		const targetAlias = this.path.getAlias()
		const joiningAlias = `${sourceAlias}_x_${targetAlias}`
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
