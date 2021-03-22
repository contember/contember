class EnumDefinition<Values extends string = string> {
	constructor(public readonly values: Values[]) {}
}

export default EnumDefinition
