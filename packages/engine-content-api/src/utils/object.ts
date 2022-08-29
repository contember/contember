type TypeGuard<Input, Result extends { [K in keyof Input]: Input[K] }> = <K extends keyof Input>(
	key: K,
	value: Input[K],
	object: Input,
) => value is Result[K]
type Filter<Input> = <K extends keyof Input>(key: K, value: Input[K], object: Input) => boolean

function filterObject<Input extends {}, Result extends { [Key in keyof Input]: Input[Key] } = Input>(
	object: Input,
	callback: TypeGuard<Input, Result> | Filter<Input>,
): Result {
	return Object.fromEntries(Object.entries(object)
		.filter(([key, value]) => (callback as any)(key, value, object)),
	) as Result
}

function mapObject<Input, Result>(
	input: { [key: string]: Input },
	callback: (value: Input, key: string) => Result,
): { [key: string]: Result } {
	return Object.fromEntries(
		Object.entries(input).map(([key, value]) => [key, callback(value, key)]),
	)
}

export { filterObject, mapObject }
