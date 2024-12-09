import { ContentMutation, ContentQuery, QueryExecutorOptions } from '@contember/client-content'
import { useRef, useState } from 'react'
import { useContentClient } from './useContentClient'
import { useReferentiallyStableCallback } from '@contember/react-utils'

export type ContentMutationState<Result> =
	| { state: 'initial' }
	| { state: 'loading' }
	| { state: 'error'; error: unknown }
	| { state: 'success'; data: Result }

export type ContentMutationOptions<T> =
	& QueryExecutorOptions

export type ContentMutationResult<Result, Variables extends Record<string, any>> = readonly [
	state: ContentMutationState<Result>,
	mutate: (variables: Variables) => Promise<Result>,
]

export function useContentMutation<Value, Variables extends Record<string, any>>(
	mutationFn: (variables: Variables) => ContentMutation<Value>,
	options?: ContentMutationOptions<Value>
): ContentMutationResult<Value, Variables>
export function useContentMutation<Value, Variables extends Record<string, any>>(
	mutationFn: (variables: Variables) => ContentMutation<Value>[],
	options?: ContentMutationOptions<Value[]>
): ContentMutationResult<Value[], Variables>
export function useContentMutation<Values extends Record<string, any>, Variables extends Record<string, any>>(
	mutationFn: (variables: Variables) => { [K in keyof Values]: ContentMutation<Values[K]> | ContentQuery<Values[K]> },
	options?: ContentMutationOptions<Values>
): ContentMutationResult<Values, Variables>
export function useContentMutation<Result, Variables extends Record<string, any>>(
	mutationFn: (variables: Variables) => ContentMutation<Result> | ContentMutation<Result>[] | Record<string, ContentMutation<any> | ContentQuery<any>>,
	options: ContentMutationOptions<Result> = {},
) {
	const [state, setState] = useState<ContentMutationState<Result>>({ state: 'initial' })
	const stateRef = useRef(state)
	stateRef.current = state
	const client = useContentClient()
	const reqId = useRef(0)

	const mutate = useReferentiallyStableCallback(async (variables: Variables) => {
		const currentReqId = ++reqId.current
		setState({ state: 'loading' })
		try {
			const data = await client.mutate(mutationFn(variables) as ContentMutation<Result>, options)
			if (reqId.current === currentReqId) {
				setState({ state: 'success', data })
			}
			return data
		} catch (e) {
			if (reqId.current === currentReqId) {
				setState({ state: 'error', error: e })
				return
			}
			throw e
		}
	})

	return [state, mutate] as const
}
