export class Literal<Value extends string = string> {
	constructor(public readonly value: Value) {}
}
