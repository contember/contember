export const defaultToUndefined = <T extends string>(input: T) =>
	(input === 'default' ? undefined : input) as Exclude<T, 'default'> | undefined
