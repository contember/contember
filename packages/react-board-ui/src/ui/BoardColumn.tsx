import React, { ComponentType } from 'react'
import { Component, EntityAccessor } from '@contember/react-binding'
import { Stack, RepeaterItemContainer } from '@contember/ui'
import { BoardColumnRendererProps } from '@contember/react-board-dnd-kit'
import { GripHorizontalIcon } from 'lucide-react'

export type BoardColumnExtraProps = {
	columnLabel?: React.ReactElement | ComponentType<BoardColumnRendererProps>
	nullColumnLabel?: React.ReactNode
	columnFooter?: React.ReactElement | ComponentType<BoardColumnRendererProps>
}

export type BoardColumnProps =
	& BoardColumnRendererProps
	& BoardColumnExtraProps

export const BoardColumn = Component<BoardColumnProps>(({
	columnLabel,
	columnFooter,
	dropIndicator,
	...props
}: BoardColumnProps) => {

	const {
		setNodeRef,
		setActivatorNodeRef,
		listeners,
		isOver,
		active,
	} = props.sortableProps ?? {}

	const label = (() => {
		if (props.value?.value === null) {
			return props.nullColumnLabel
		}
		if (React.isValidElement(columnLabel)) {
			return columnLabel
		}
		if (columnLabel) {
			return React.createElement(columnLabel as ComponentType<any>, props)
		}
		if (!(props.value?.value instanceof EntityAccessor)) {
			return props.value?.value.label
		}
		return undefined
	})()

	const dropIndicatorEl = <div style={{
		'position': 'absolute',
		'top': 0,
		'bottom': 0,
		...(dropIndicator === 'after' ? {
			right: '-10px',
		} : {
			left: '-10px',
		}),
		'height': '100%',
		'width': '5px',
		'border': '1px solid transparent',
		'backgroundColor': '#486AADFF',
		'borderRadius': '2px',
		// 'marginLeft': isBellow ? '5px' : '-10px',
	}} />
	const isSortable = props.boardMethods?.moveColumn && props.value?.value !== null

	const itemIsOver = isOver && active?.data.current?.type === 'item'
	return (
		<div style={{ position: 'relative' }}>
			{dropIndicator === 'before' ? dropIndicatorEl : null}
			<RepeaterItemContainer
				padding={'double'}
				label={label}
				style={itemIsOver ? { backgroundColor: '#f5e1ad' } : {}}
				dragHandleComponent={isSortable ? () => <div {...listeners} ref={setActivatorNodeRef}>
					<GripHorizontalIcon />
				</div> : undefined}
				ref={setNodeRef}
			>
				<Stack>
					{props.children}
					{columnFooter ? (React.isValidElement(columnFooter) ? columnFooter : React.createElement(columnFooter as ComponentType<any>, props)) : null}
				</Stack>
			</RepeaterItemContainer>
			{dropIndicator === 'after' ? dropIndicatorEl : null}
		</div>
	)
}, ({ columnLabel }) => <>{columnLabel}</>)
