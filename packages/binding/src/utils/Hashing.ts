import { SubTreeMarkerParameters } from '../markers'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	DesugaredHasManyRelation,
	ExpectedEntityCount,
	Filter,
	HasManyRelation,
	HasOneRelation,
	OrderBy,
	UniqueWhere,
} from '../treeParameters'
import { assertNever } from './assertNever'

export class Hashing {
	public static hashHasOneRelation(relation: HasOneRelation): number {
		const where: Array<Filter | UniqueWhere | string | undefined> = [
			ExpectedEntityCount.UpToOne,
			relation.field,
			relation.filter,
			relation.reducedBy,
			relation.connections,
		]

		return Hashing.hashArray(where)
	}

	// TODO
	public static hashHasManyRelation(relation: HasManyRelation | DesugaredHasManyRelation): number {
		const where: Array<Filter | UniqueWhere | OrderBy | string | number | undefined> = [
			ExpectedEntityCount.PossiblyMany,
			relation.field,
			relation.filter,
			(relation as HasManyRelation).connections,
			(relation as HasManyRelation).offset,
			(relation as HasManyRelation).limit,
			(relation as HasManyRelation).orderBy,
		]

		return Hashing.hashArray(where)
	}

	public static hashMarkerTreeParameters(parameters: SubTreeMarkerParameters): number {
		if (parameters.isConstrained) {
			if (parameters instanceof BoxedQualifiedSingleEntity) {
				return Hashing.hashArray([
					parameters.type,
					parameters.value.where,
					parameters.value.entityName,
					parameters.value.filter,
				])
			} else if (parameters instanceof BoxedQualifiedEntityList) {
				const value = parameters.value
				return Hashing.hashArray([
					parameters.type,
					value.entityName,
					value.filter,
					value.orderBy,
					value.offset,
					value.limit,
				])
			}
		} else {
			return Hashing.hashArray([parameters.type, parameters.value.entityName])
		}
		return assertNever(parameters)
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
