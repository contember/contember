import { EntityAccessor } from '@contember/react-binding'
import { ReactNode, useEffect } from 'react'
import * as React from 'react'
import { DataViewKeyboardEventHandlerContext, DataViewHighlightIndexContext, useDataViewEntityListAccessor } from '../../contexts'
import { useReferentiallyStableCallback } from '@contember/react-utils'

export const DataViewInteractionProvider = ({ children, onSelectHighlighted }: {
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
