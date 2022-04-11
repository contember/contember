import { waitForTick } from './tick'
import { DatabaseContext } from '../model'

export type ItemLoader<Arg, Item> = (args: Arg) => Promise<Item>

export type BatchLoaderArgs<Arg, Result, Item> = [createResult: (args: Arg[], db: DatabaseContext) => Promise<Result>, getItem: (arg: Arg, result: Result) => Item]
export const batchLoader = <Arg, Result, Item>(...args: BatchLoaderArgs<Arg, Result, Item>) => args

export const initBatchLoader = <Arg, Result, Item>(
	[createResult, getItem]: BatchLoaderArgs<Arg, Result, Item>,
	db: DatabaseContext,
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
				return await createResult(batchArgs, db)
			})()
		}
		return getItem(arg, await result)
	}
}
