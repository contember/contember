import { useReferentiallyStableCallback } from '@contember/react-utils'
import deepEqual from 'deep-equal'
import { ReactNode, memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useExpectSameValueReference, useOnWindowResize } from '../react-hooks'
import { SafeAreaInsetsContext, useContainerInsetsContext } from './Contexts'
import { combineElementInsets, diffContainerInsetsFromElementRects, getScreenInnerBoundingRect } from './Helpers'
import { ContainerInsets } from './Types'

type SafeAreaInsetsProviderProps = {
	children: ReactNode;
	insets?: Partial<ContainerInsets>;
}

function getInitialScreenRectsState() {
	const screenRect = getScreenInnerBoundingRect()

	return {
		screen: screenRect,
		safeArea: screenRect,
	}
}

export const SafeAreaInsetsProvider = memo(({ children, insets: insetsProp }: SafeAreaInsetsProviderProps) => {
	useExpectSameValueReference(insetsProp)

	const [rects, setRects] = useState(getInitialScreenRectsState())
	const nativeInsetsElementRef = useRef<HTMLDivElement>(null)

	const getNativeInsets = useReferentiallyStableCallback(() => {
		if (nativeInsetsElementRef.current) {
			const next = {
				screen: getScreenInnerBoundingRect(),
				safeArea: nativeInsetsElementRef.current.getBoundingClientRect(),
			}

			if (!deepEqual(next, rects)) {
				setRects(next)
			}
		}
	})

	useLayoutEffect(getNativeInsets, [getNativeInsets])
	useOnWindowResize(getNativeInsets)

	const parentScreenInsets = useContainerInsetsContext()

	const insets = useMemo(() => combineElementInsets(
		parentScreenInsets,
		diffContainerInsetsFromElementRects(rects.screen, rects.safeArea),
		insetsProp,
	), [insetsProp, parentScreenInsets, rects.safeArea, rects.screen])

	return (
		<>
			<SafeAreaInsetsContext.Provider value={insets}>
				{children}
			</SafeAreaInsetsContext.Provider>
			<div ref={nativeInsetsElementRef} style={safeAreaInsetsStyle} />
		</>
	)
})
SafeAreaInsetsProvider.displayName = 'SafeAreaInsetsProvider'

const safeAreaInsetsStyle = Object.freeze({
	bottom: `env(safe-area-inset-bottom, 0px)`,
	left: `env(safe-area-inset-left, 0px)`,
	right: `env(safe-area-inset-right, 0px)`,
	top: `env(safe-area-inset-top, 0px)`,
	position: 'fixed',
	pointerEvents: 'none',
})
