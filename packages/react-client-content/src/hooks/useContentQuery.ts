import { ContentOperation, ContentQuery, QueryExecutorOptions } from '@contember/client-content'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useContentClient } from './useContentClient'
import { useConstantValueInvariant, useObjectMemo } from '@contember/react-utils'

export type ContentQueryOptions = QueryExecutorOptions

export type ContentQueryResult<T> = readonly [
	state: ContentQueryState<T>,
	meta: () => void
]

export type ContentQueryState<Result> =
	| { state: 'loading' }
	| { state: 'error'; error: unknown }
	| { state: 'success'; data: Result }
	| { state: 'refreshing'; data: Result }

export function useContentQuery<Value>(
	query: ContentQuery<Value>,
	options?: ContentQueryOptions,
): ContentQueryResult<Value>
export function useContentQuery<Values extends Record<string, any>>(
	queries: { [K in keyof Values]: ContentQuery<Values[K]> },
	options?: ContentQueryOptions,
): ContentQueryResult<Values>
export function useContentQuery<T>(
	query: ContentQuery<T> | { [K: string]: ContentQuery<T> },
	options: ContentQueryOptions = {},
): ContentQueryResult<T> {
	const client = useContentClient()

	const [state, setState] = useState<ContentQueryState<T>>({ state: 'loading' })
	const stateRef = useRef(state)
	stateRef.current = state
	useConstantValueInvariant(query instanceof ContentOperation, 'cannot change between single and multiple queries')

	// eslint-disable-next-line react-hooks/rules-of-hooks
	const queryMemo = query instanceof ContentOperation ? query : useObjectMemo(query)
	const optionsMemo = useObjectMemo(options)

	const reqId = useRef(0)

	const triggerLoad = useCallback(async () => {
		const currentReqId = ++reqId.current
		try {
			if (stateRef.current.state === 'success') {
				setState({ state: 'refreshing', data: stateRef.current.data })
			}
			const data = await client.query(queryMemo as ContentQuery<T>, optionsMemo)
			if (reqId.current !== currentReqId) {
				return
			}
			setState({ state: 'success', data })
		} catch (e) {
			console.error(e)
			if (reqId.current !== currentReqId) {
				return
			}
			setState({ state: 'error', error: e })
		}

	}, [client, queryMemo, optionsMemo])

	useEffect(() => {
		triggerLoad()
	}, [triggerLoad])

	return [state, triggerLoad] as const
}
