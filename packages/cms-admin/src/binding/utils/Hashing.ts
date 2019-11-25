import { GraphQlBuilder } from '@contember/client'
import { assertNever } from '@contember/utils'
import { Input } from '@contember/schema'
import { MarkerTreeConstraints, ReferenceMarker } from '../markers'
import { ExpectedEntityCount } from '../treeParameters/ExpectedEntityCount'

export class Hashing {
	public static hashReferenceConstraints(constraints: ReferenceMarker.ReferenceConstraints): number {
		const where: Array<
			| Input.Where<GraphQlBuilder.Literal>
			| Input.UniqueWhere<GraphQlBuilder.Literal>
			| Input.Where
			| undefined
			| ExpectedEntityCount
		> = [constraints.filter, constraints.reducedBy, constraints.expectedCount]

		return Hashing.hashArray(where)
	}

	public static hashMarkerTreeConstraints(constraints: MarkerTreeConstraints): number {
		if (constraints.type === 'unconstrained') {
			return 0
		} else if (constraints.type === 'nonUnique') {
			return Hashing.hashArray([
				constraints.type,
				constraints.filter,
				constraints.orderBy,
				constraints.offset,
				constraints.limit,
			])
		} else if (constraints.type === 'unique') {
			return Hashing.hashArray([constraints.type, constraints.where])
		}
		assertNever(constraints)
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
