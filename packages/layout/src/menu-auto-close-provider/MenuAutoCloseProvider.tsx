import { NavigationContext, PreventCloseContext } from '@contember/ui'
import { ReactNode, useCallback, useContext, useEffect, useRef } from 'react'

export type MenuAutoCloseProviderProps = {
	children: ReactNode;
	onAutoClose: () => void;
}

const PREVENT_HAPPENED_RECENTLY = 100

export function MenuAutoCloseProvider({ children, onAutoClose }: MenuAutoCloseProviderProps): JSX.Element {
	const onAutoCloseRef = useRef(onAutoClose)

	if (onAutoCloseRef.current !== onAutoClose) {
		throw new Error('Callback reference is not stable. Try memoizing the callback with useCallback, useReferentiallyStableCallback, useEvent or useRef')
	}

	const navigationContext = useContext(NavigationContext)
	const preventedAt = useRef<Date | null>(null)

	const preventMenuClose = useCallback(() => {
		preventedAt.current = new Date()
	}, [])

	useEffect(() => {
		const wasPrevented = preventedAt.current
			? (new Date()).valueOf() - preventedAt.current.valueOf() <= PREVENT_HAPPENED_RECENTLY
			: false

		if (!wasPrevented) {
			onAutoCloseRef.current()
		}
	}, [navigationContext])

	return (
		<PreventCloseContext.Provider value={preventMenuClose}>
			{children}
		</PreventCloseContext.Provider>
	)
}
