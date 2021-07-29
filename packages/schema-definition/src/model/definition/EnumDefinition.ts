export class EnumDefinition<Values extends string = string> {
	constructor(public readonly values: Values[]) {}
}

export function createEnum<Values extends string>(...values: Values[]): EnumDefinition<Values> {
	return new EnumDefinition<Values>(values)
}
