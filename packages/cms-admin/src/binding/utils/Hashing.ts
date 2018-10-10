import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'

export default class Hashing {
	public static hashWhere(
		where: Input.Where<GraphQlBuilder.Literal> | Input.UniqueWhere<GraphQlBuilder.Literal> | Input.Where,
	): number {
		const json = JSON.stringify(where)
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
