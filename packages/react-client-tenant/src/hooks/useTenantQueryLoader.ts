import { useCallback, useEffect, useRef, useState } from 'react'
import { useObjectMemo } from '@contember/react-utils'

export type TenantQueryLoaderState<Result> =
	| { state: 'loading' }
	| { state: 'error'; error: unknown }
	| { state: 'success'; data: Result }
	| { state: 'refreshing'; data: Result }

export type TenantQueryLoaderMethods = {
	refresh: () => void
}

export const useTenantQueryLoader = <TVariables extends object, Result>(fetcher: (variables: TVariables) => Promise<Result>, variables: TVariables): [TenantQueryLoaderState<Result>, TenantQueryLoaderMethods] => {
	const [state, setState] = useState<TenantQueryLoaderState<Result>>({ state: 'loading' })
	const stateRef = useRef(state)
	stateRef.current = state
	const variablesMemo = useObjectMemo(variables)

	const reqId = useRef(0)

	const triggerLoad = useCallback(async () => {
		const currentReqId = ++reqId.current
		try {
			if (stateRef.current.state === 'success') {
				setState({ state: 'refreshing', data: stateRef.current.data })
			}
			const data = await fetcher(variablesMemo)
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

	}, [fetcher, variablesMemo])


	useEffect(() => {
		triggerLoad()
	}, [triggerLoad])

	return [state, { refresh: triggerLoad }]
}
