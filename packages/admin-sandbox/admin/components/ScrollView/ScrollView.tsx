import { useClassNameFactory, useComposeRef, useOnElementResize, useScrollOffsets } from '@contember/react-utils'
import { HTMLDivElementProps } from '@contember/ui'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { forwardRef, memo, useCallback, useLayoutEffect, useRef } from 'react'

export interface ScrollViewProps extends ComponentClassNameProps, Omit<HTMLDivElementProps, keyof ComponentClassNameProps> {
	horizontal?: boolean
	reverse?: boolean
	'data-scrolled-top'?: boolean
	'data-scrolled-left'?: boolean
	'data-scrolled-right'?: boolean
	'data-scrolled-bottom'?: boolean
}

export const ScrollView = memo(forwardRef<HTMLDivElement, ScrollViewProps>(({
	children,
	className: classNameProp,
	componentClassName = 'scroll-view',
	horizontal = false,
	reverse = false,
	...props
}, forwardedRef) => {
	const className = useClassNameFactory(componentClassName)
	const localRef = useRef<HTMLDivElement>(null)
	const composeRef = useComposeRef(forwardedRef, localRef)
	const scrollOffsets = useScrollOffsets(localRef)

	// const userHasScrolled = useRef(false)
	//
	// useEffect(() => {
	//   userHasScrolled.current = horizontal
	//     ? (reverse ? scrollOffsets.right : scrollOffsets.left) > 0
	//     : (reverse ? scrollOffsets.bottom : scrollOffsets.top) > 0
	// }, [scrollOffsets, horizontal, reverse])

	const initScrollTo = useCallback(() => {
		// React Hook useCallback has an unnecessary dependency: 'children'.
		// Either exclude it or remove the dependency array.
		// react-hooks/exhaustive-deps:
		children

		if (localRef.current) {
			if (horizontal) {
				localRef.current.scrollLeft = reverse ? localRef.current.scrollWidth : 0
			} else {
				localRef.current.scrollTop = reverse ? localRef.current.scrollHeight : 0
			}
		}
	}, [horizontal, children, reverse])

	useLayoutEffect(initScrollTo, [initScrollTo])
	useOnElementResize(localRef, initScrollTo)

	return (
		<div
			ref={composeRef}
			{...props}
			className={className(null, classNameProp)}
			data-direction={dataAttribute(horizontal ? 'horizontal' : 'vertical')}
			data-scrolled-top={dataAttribute(props['data-scrolled-top'] ?? scrollOffsets.top > 0)}
			data-scrolled-left={dataAttribute(props['data-scrolled-left'] ?? scrollOffsets.left > 0)}
			data-scrolled-right={dataAttribute(props['data-scrolled-right'] ?? scrollOffsets.right > 0)}
			data-scrolled-bottom={dataAttribute(props['data-scrolled-bottom'] ?? scrollOffsets.bottom > 0)}
			data-reverse={dataAttribute(reverse)}
		>
			<div className={className('content')}>
				{children}
			</div>
		</div>
	)
}))
ScrollView.displayName = 'ScrollView'
