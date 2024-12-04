import { ContentClient, ContentMutation, ContentQuery } from '@contember/client-content'
import { useCurrentContentGraphQlClient } from '@contember/react-client'
import { useEffect, useMemo, useState } from 'react'
import { MutationOptions, MutationOverloads, QueryOptions, QueryOverloads } from '../types'

export const useContentClient = () => {
	const contentClient = useCurrentContentGraphQlClient()
	const client = useMemo(() => new ContentClient(contentClient), [contentClient])

	const useQuery: QueryOverloads = <T>(query: ContentQuery<T> | {
		[K: string]: ContentQuery<T>
	}, options: QueryOptions<any> = {}) => {
		const [data, setData] = useState<T>()
		const [error, setError] = useState<Error | null>(null)
		const [isLoading, setIsLoading] = useState(false)

		useEffect(() => {
			const fetchData = async () => {
				setIsLoading(true)
				try {
					const { onSuccess, onError, ...executorOptions } = options
					const result = await client.query(query as ContentQuery<T>, executorOptions)
					setData(result)
					onSuccess?.(result)
				} catch (e) {
					const error = e instanceof Error ? e : new Error('Unknown error')
					setError(error)
					options.onError?.(error)
				} finally {
					setIsLoading(false)
				}
			}

			fetchData()
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		return { data, error, isLoading }
	}

	const useMutation: MutationOverloads = <T, V extends Record<string, any>>(
		mutationFn: (variables: V) => ContentMutation<T> | ContentMutation<T>[] | Record<string, ContentMutation<any> | ContentQuery<any>>,
		options: MutationOptions<T> = {},
	) => {
		const [isLoading, setIsLoading] = useState(false)

		const mutate = async (variables: V) => {
			setIsLoading(true)
			try {
				const { onSuccess, onError, ...executorOptions } = options
				const result = await client.mutate(mutationFn(variables) as ContentMutation<T>, executorOptions)
				onSuccess?.(result)
				return result
			} catch (e) {
				const error = e instanceof Error ? e : new Error('Unknown error')
				options.onError?.(error)
				throw error
			} finally {
				setIsLoading(false)
			}
		}

		return { mutate, isLoading }
	}

	return {
		useQuery,
		useMutation,
		client,
	}
}
