export class Literal<Value extends string = string> {
	constructor(public readonly value: Value) {}

	public toString() {
		return `Literal(${this.value})`
	}
}
