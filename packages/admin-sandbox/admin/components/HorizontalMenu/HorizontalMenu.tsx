import { useClassName, useComposeRef } from '@contember/react-utils'
import { Stack } from '@contember/ui'
import { stateDataAttributes } from '@contember/utilities'
import { forwardRef, memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HorizontalMenuItem } from './HorizontalMenuItem'
import { HorizontalMenuContext, defaultHorizontalMenuProps, useHorizontalMenuContext } from './contexts'
import { HorizontalMenuContainerProps } from './types'

const HorizontalMenuContainer = memo(forwardRef<HTMLDivElement, HorizontalMenuContainerProps>((props, forwardedRef) => {
	const horizontalMenuContext = useHorizontalMenuContext()
	const innerRef = useRef<HTMLDivElement>(null)
	const composeRef = useComposeRef(forwardedRef, innerRef)

	const [isInModal, setIsInModal] = useState(false)

	useLayoutEffect(() => {
		if (innerRef.current) {
			setIsInModal(isInModalPanel(innerRef.current))
		}
	}, [])

	const mergedProps = {
		...defaultHorizontalMenuProps,
		...horizontalMenuContext,
		...(isInModal ? { horizontal: false, hover: false } : undefined),
		...props,
	}

	const {
		children,
		className,
		componentClassName,
		horizontal,
		itemsContentHorizontal,
		itemsIconsScale,
		itemsSizeEvenly,
		compact,
		style,
		hover,
		...rest
	} = mergedProps

	return (
		<HorizontalMenuContext.Provider value={mergedProps}>
			<Stack
				ref={composeRef}
				{...stateDataAttributes({ compact, itemsSizeEvenly, itemsIconsScale, itemsContentHorizontal, hover })}
				className={useClassName(componentClassName, className)}
				horizontal={horizontal}
				gap="gap"
				style={useMemo(() => ({
					...style,
					'--cui-horizontal-menu--icons-scale': itemsIconsScale,
				}), [itemsIconsScale, style])}
				{...rest}
			>
				{children}
			</Stack>
		</HorizontalMenuContext.Provider>
	)
}))
HorizontalMenuContainer.displayName = 'Menu'

export const Menu = Object.assign(HorizontalMenuContainer, {
	Item: HorizontalMenuItem,
})


function isInModalPanel(element: HTMLDivElement): boolean {
	let parent: HTMLElement | null = element.parentElement

	while (parent !== null) {
		if (parent.classList.contains('cui-layout-panel')) {
			if (parent.dataset['behavior'] === 'modal') {
				return true
			} else {
				return false
			}
		}

		parent = parent.parentElement
	}

	return false
}
