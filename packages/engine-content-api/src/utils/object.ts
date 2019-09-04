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
	return (Object.entries(object) as any)
		.filter(<K extends keyof Input>(it: [K, Input[K]]): it is [K, Result[K]] =>
			(callback as any)(it[0] as K, it[1] as Input[K], object),
		)
		.reduce((result: Result, [key, value]: [string, any]) => ({ ...(result as any), [key]: value }), {} as Result)
}

export { filterObject }
