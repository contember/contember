import { ContentClient } from '../src/index.js'

export const createClient = (result?: any) => {
	const calls: { query: string; variables: Record<string, unknown> }[] = []
	const client = new ContentClient({
		execute: <T>(query: string, options: any): Promise<T> => {
			calls.push({
				query,
				...options,
			})
			return Promise.resolve(result ?? {})
		},
	})
	return [client, calls] as const
}
