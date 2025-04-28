import { useCallback, useRef } from 'react'

export type NoConstructor<T extends Function> =
	T extends new (...args: unknown[]) => unknown
		? never
		: T
// TODO: Should be possible to remove when React.useEvent() lands
export const useReferentiallyStableCallback = <T extends Function>(callback: NoConstructor<T>): T => {
	const ref = useRef(callback)
	ref.current = callback
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useCallback<T>(((...args: any[]) => {
		return ref.current(...args)
	}) as unknown as T, [])
}
