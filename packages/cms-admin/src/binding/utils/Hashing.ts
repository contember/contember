import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'

export default class Hashing {
	public static hashWhere(
		...where: Array<Input.Where<GraphQlBuilder.Literal> | Input.UniqueWhere<GraphQlBuilder.Literal> | Input.Where | undefined>
	): number {
		if (where.length === 0) {
			return 0
		}

		const json = where.map(item => JSON.stringify(item)).join('')
		return Hashing.hash(json)
	}

	// Taken from Java
	private static hash(str: string): number {
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
