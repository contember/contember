import React from 'react'
import { Button, RepeaterItemContainer } from '@contember/ui'
import { Component } from '@contember/react-binding'
import { TrashIcon, GripVerticalIcon } from 'lucide-react'
import { BoardItemRendererProps } from '@contember/react-board-dnd-kit'

export type BoardItemExtraProps = {
	children: React.ReactNode
}

export type BoardItemProps =
	& BoardItemRendererProps
	& BoardItemExtraProps

export const BoardItem = Component(({ sortableProps, children, boardMethods = {}, value, dropIndicator }: BoardItemProps) => {
	const {
		setNodeRef,
		setActivatorNodeRef,
		listeners,
	} = sortableProps ?? {}


	const dropIndicatorEl = <div style={{
		'position': 'absolute',
		'left': 0,
		'right': 0,
		'width': '100%',
		'height': '5px',
		'border': '1px solid transparent',
		'backgroundColor': '#486AADFF',
		'borderRadius': '2px',
		'marginTop': dropIndicator === 'after' ? '5px' : '-10px',
	}} />

	const isSortable = boardMethods.moveItem
	const isRemovable = boardMethods.removeItem

	return <div style={{ position: 'relative' }}>
		{dropIndicator === 'before' ? dropIndicatorEl : null}
		<RepeaterItemContainer
			padding={'gap'}
			gap={'gap'}
			dragHandleComponent={isSortable ? () => <div {...listeners} ref={setActivatorNodeRef}>
				<GripVerticalIcon />
			</div> : undefined}
			ref={setNodeRef}
			actions={isRemovable ? <Button onClick={() => value?.value ? boardMethods.removeItem?.(value?.value) : null}><TrashIcon/></Button> : undefined}
		>
			{children}
		</RepeaterItemContainer>
		{dropIndicator === 'after' ? dropIndicatorEl : null}
	</div>
}, ({ children }) => <>{children}</>)
