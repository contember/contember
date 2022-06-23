import { waitForTick } from './tick.js'

export type ItemLoader<Arg, Item> = (args: Arg) => Promise<Item>

export const createBatchLoader = <Arg, Result, Item>(
	createResult: (args: Arg[]) => Promise<Result>,
	getItem: (arg: Arg, result: Result) => Item,
): ItemLoader<Arg, Item> => {
	let args: Arg[] = []
	let result: Promise<Result> | null = null

	return async (arg: Arg) => {
		args.push(arg)
		if (!result) {
			result = (async () => {
				await waitForTick()
				const batchArgs = args
				args = []
				result = null
				return await createResult(batchArgs)
			})()
		}
		return getItem(arg, await result)
	}
}
