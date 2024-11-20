import * as React from 'react'

const ReactSecretInternals =
	(React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ??
	(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED


export const withDummyDispatcher = <T>(cb: () => T): T => {
	if (!ReactSecretInternals) {
		console.warn('React internals are not available, using dummy dispatcher has no effect')
		return cb()
	}
	const { ReactCurrentDispatcher } = ReactSecretInternals
	const originalCurrentDispatcher = ReactCurrentDispatcher.current
	ReactCurrentDispatcher.current = {
		...originalCurrentDispatcher,
		...dummyDispatcher,
	}
	const result = cb()
	ReactCurrentDispatcher.current = originalCurrentDispatcher
	return result
}

let id = 0
const dummyDispatcher = {
	useMemo: (value: () => any) => {
		return value()
	},
	useCallback: (cb: any) => {
		return cb
	},
	useReducer: (reducer: any, initializerArg: any, initializer: any) => {
		return [initializer ? initializer(initializerArg) : initializerArg, () => {
			throw new Error('dispatch is not supported in static rendering')
		}]
	},
	useRef: (initialValue: any) => {
		return { current: initialValue }
	},
	useState: (initialState: any) => {
		return [typeof initialState === 'function' ? initialState() : initialState, () => {
			throw new Error('setState is not supported in static rendering')
		}]
	},
	useDeferredValue: (value: any) => {
		return value
	},
	useId() {
		return `id-${id++}`
	},
	useDebugValue: () => {
		// do nothing
	},
	useEffect: () => {
		// do nothing
	},
	useLayoutEffect: () => {
		// do nothing
	},
	useInsertionEffect() {
		// do nothing
	},
	useImperativeHandle: () => {
		// do nothing
	},
	useTransition() {
		return [false, () => {
			throw new Error('startTransition is not supported in static rendering')
		}]
	},
	useSyncExternalStore() {
		throw new Error('useSyncExternalStore is not supported in static rendering')
	},
	useContext() {
		throw new Error('useContext is not supported in static rendering')
	},
}
