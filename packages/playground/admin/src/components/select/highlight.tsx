import * as React from 'react'
import { ReactNode, useEffect, useLayoutEffect } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { createRequiredContext, useReferentiallyStableCallback } from '@contember/react-utils'
import { EntityAccessor } from '@contember/binding'
import { useDataViewEntityListAccessor } from '@contember/react-dataview'
import { useEntity } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'

export const [DataViewHighlightIndexContext, useDataViewHighlightIndex] = createRequiredContext<number | null>('DataViewHighlightIndex')
export const [DataViewKeyboardEventHandlerContext, useDataViewKeyboardEventHandler] = createRequiredContext<React.KeyboardEventHandler>('DataViewKeyboardEventHandler')

export const DataViewInteractionContext = ({ children, onSelectHighlighted }: {
	children: ReactNode
	onSelectHighlighted?: (entity: EntityAccessor) => void
}) => {
	const [highlightIndex, setHighlightIndex] = React.useState<number | null>(null)
	const accessor = useDataViewEntityListAccessor()
	const prevKeys = React.useRef<string | null>(null)
	useEffect(() => {
		const keys = Array.from(accessor?.ids() ?? []).join(';')
		if (keys !== prevKeys.current) {
			setHighlightIndex(null)
			prevKeys.current = keys
		}
	}, [accessor])

	const keyboardEventHandler = useReferentiallyStableCallback((event: React.KeyboardEvent) => {
		if (accessor === undefined) {
			return
		}
		const totalItems = accessor.length - 1
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setHighlightIndex(highlightIndex === null || highlightIndex >= totalItems ? 0 : highlightIndex + 1)
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			setHighlightIndex(highlightIndex === null || highlightIndex <= 0 ? totalItems : highlightIndex - 1)
		} else if (event.key === 'End' && event.ctrlKey) {
			event.preventDefault()
			setHighlightIndex(totalItems)
		} else if (event.key === 'Home' && event.ctrlKey) {
			event.preventDefault()
			setHighlightIndex(0)
		} else if (event.key === 'Enter' && highlightIndex !== null) {
			event.preventDefault()
			onSelectHighlighted?.(Array.from(accessor)[highlightIndex])
		}
	})
	return (
		<DataViewHighlightIndexContext.Provider value={highlightIndex}>
			<DataViewKeyboardEventHandlerContext.Provider value={keyboardEventHandler}>
				{children}
			</DataViewKeyboardEventHandlerContext.Provider>
		</DataViewHighlightIndexContext.Provider>
	)
}

export const DataViewHighlightRow = (props: {
	children: ReactNode
}) => {
	const highlightIndex = useDataViewHighlightIndex()
	const accessor = useDataViewEntityListAccessor()
	const entity = useEntity()

	const highlightedEntityKey = highlightIndex !== null && accessor ? Array.from(accessor.keys())[highlightIndex ?? 0] : null
	const isHighlighted = entity.key === highlightedEntityKey
	const elRef = React.useRef<HTMLElement>(null)

	useLayoutEffect(() => {
		if (isHighlighted && elRef.current) {
			const scrollArea = elRef.current.closest('[data-radix-scroll-area-viewport]')
			if (scrollArea) {
				let scrollTo = elRef.current.offsetTop - scrollArea.clientHeight / 2 + elRef.current.clientHeight / 2
				scrollArea.scrollTo({
					// to center
					top: scrollTo,
					behavior: 'smooth',
				})

			}
		}
	}, [isHighlighted])

	return (
		<Slot
			{...props}
			ref={elRef}
			data-highlighted={dataAttribute(isHighlighted)}
		/>
	)
}

export const DataViewKeyboardEventHandler = (props: {
	children: ReactNode
}) => {
	const keyboardEventHandler = useDataViewKeyboardEventHandler()
	return (
		<Slot
			onKeyDown={keyboardEventHandler}
			{...props}
		/>
	)
}
