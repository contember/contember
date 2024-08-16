import * as React from 'react'
import { forwardRef, ReactNode, useEffect, useRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDataViewEntityListAccessor, useDataViewHighlightIndex } from '../../contexts'
import { EntityAccessor, useEntity } from '@contember/react-binding'
import { dataAttribute } from '@contember/utilities'
import { useComposeRef } from '@contember/react-utils'

export interface DataViewHighlightEvent {
	entity: EntityAccessor
	element: HTMLElement

}

export interface DataViewHighlightRowProps {
	children: ReactNode
	onHighlight?: (event: DataViewHighlightEvent) => void
}

export const DataViewHighlightRow = forwardRef<HTMLElement, DataViewHighlightRowProps>(({ onHighlight, ...props }, ref) => {
	const highlightIndex = useDataViewHighlightIndex()
	const accessor = useDataViewEntityListAccessor()
	const entity = useEntity()
	const entityAccessor = entity.getAccessor

	const highlightedEntityKey = highlightIndex !== null && accessor ? Array.from(accessor.keys())[highlightIndex ?? 0] : null
	const isHighlighted = entity.key === highlightedEntityKey

	const innerRef = useRef<HTMLElement>(null)
	const composeRef = useComposeRef(ref, innerRef)

	useEffect(() => {
		if (isHighlighted && innerRef.current && onHighlight) {
			onHighlight?.({
				entity: entityAccessor(),
				element: innerRef.current,
			})
		}
	}, [entityAccessor, isHighlighted, onHighlight])

	return (
		<Slot
			{...props}
			ref={composeRef}
			data-highlighted={dataAttribute(isHighlighted)}
		/>
	)
})
