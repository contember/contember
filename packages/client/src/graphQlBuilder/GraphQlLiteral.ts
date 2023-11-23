/**
 * @deprecated Directly use the value instead.
 */
export class GraphQlLiteral<Value extends string = string> {
	constructor(public readonly value: Value) {
		if (import.meta.env.DEV) {
			console.warn('GraphQlLiteral is deprecated, use the value directly instead.')
		}
	}

	public toString() {
		return `Literal(${this.value})`
	}
}
