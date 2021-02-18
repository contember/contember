import {
	DesugaredHasManyRelation,
	DesugaredHasOneRelation,
	ExpectedEntityCount,
	Filter,
	HasManyRelation,
	HasOneRelation,
	OrderBy,
	QualifiedEntityList,
	QualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
	UniqueWhere,
} from '../treeParameters'

// TODO update hashing so that for offset, 0 == undefined
export class Hashing {
	public static hashHasOneRelation(relation: HasOneRelation | DesugaredHasOneRelation): number {
		const where: Array<Filter | UniqueWhere | string | undefined> = [
			ExpectedEntityCount.UpToOne,
			relation.field,
			relation.filter,
			relation.reducedBy,
		]

		return Hashing.hashArray(where)
	}

	public static hashHasManyRelation(relation: HasManyRelation | DesugaredHasManyRelation): number {
		const where: Array<Filter | UniqueWhere | OrderBy | string | number | undefined> = [
			ExpectedEntityCount.PossiblyMany,
			relation.field,
			relation.filter,
			'offset' in relation ? relation.offset : undefined,
			'limit' in relation ? relation.limit : undefined,
			'orderBy' in relation ? relation.orderBy : undefined,
		]

		return Hashing.hashArray(where)
	}

	public static hashEntityListSubTreeParameters(
		parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList,
	): number {
		if (parameters.isCreating) {
			return Hashing.hashArray([parameters.isCreating, parameters.entityName])
		}
		return Hashing.hashArray([
			parameters.isCreating,
			parameters.entityName,
			parameters.filter,
			parameters.orderBy,
			parameters.offset,
			parameters.limit,
		])
	}

	public static hashEntitySubTreeParameters(
		parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
	): number {
		if (parameters.isCreating) {
			return Hashing.hashArray([parameters.isCreating, parameters.entityName])
		}
		return Hashing.hashArray([parameters.isCreating, parameters.where, parameters.entityName, parameters.filter])
	}

	private static hashArray(array: any[]): number {
		const json = array.map(item => JSON.stringify(item)).join('_')
		return Hashing.hash(json)
	}

	// Taken from Java
	public static hash(str: string): number {
		let hash = 0
		if (str.length === 0) {
			return hash
		}
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) - hash + str.charCodeAt(i)
			hash = hash & hash // Convert to 32bit integer
		}
		return Math.abs(hash)
	}
}
