import React, { ReactNode } from 'react'
import { useRepeaterActiveEntity } from '../internal/contexts'
import { Portal } from '@radix-ui/react-portal'
import { DragOverlay } from '@dnd-kit/core'
import { AccessorTree, Entity, useAccessorTreeState } from '@contember/react-binding'

export const RepeaterSortableDragOverlay = ({ children }: {
	children: ReactNode
}) => {
	const activeItem = useRepeaterActiveEntity()
	const accessorTreeState = useAccessorTreeState()
	if (!activeItem) {
		return null
	}
	return (
		<Portal>
			<DragOverlay>
				<AccessorTree state={accessorTreeState}>
					<Entity accessor={activeItem}>
						{children}
					</Entity>
				</AccessorTree>
			</DragOverlay>
		</Portal>
	)
}
