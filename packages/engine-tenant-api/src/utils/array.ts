export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
	return value !== null && value !== undefined
}

type KeysOfType<T, U> = {
	[P in keyof T]: T[P] extends U ? P : never
}[keyof T]

type PickByType<T, U> = Pick<T, KeysOfType<T, U>>

export const indexBy = <Item, Key extends KeysOfType<Item, string>, Index extends Item[Key] & string>(
	items: Item[],
	key: Key,
): Record<Index, Item> => {
	return items.reduce(
		(acc, item) => ({
			...acc,
			[(item[key] as unknown) as string]: item,
		}),
		{} as Record<Index, Item>,
	)
}

export const indexListBy = <Item, Key extends KeysOfType<Item, string>, Index extends Item[Key] & string>(
	items: Item[],
	key: Key,
): Record<Index, Item[]> => {
	return items.reduce(
		(acc, item) => ({
			...acc,
			[(item[key] as unknown) as Index]: [...(acc[(item[key] as unknown) as Index] || []), item],
		}),
		{} as Record<Index, Item[]>,
	)
}
