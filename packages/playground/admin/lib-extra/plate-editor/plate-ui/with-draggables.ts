import { createNodesWithHOC } from '@udecode/plate-common'
import { withDraggable as withDraggablePrimitive, WithDraggableOptions } from '@udecode/plate-dnd'
import { ELEMENT_H1, ELEMENT_H2, ELEMENT_H3 } from '@udecode/plate-heading'
import { ELEMENT_OL, ELEMENT_UL } from '@udecode/plate-list'
import { ELEMENT_PARAGRAPH } from '@udecode/plate-paragraph'
import { FC } from 'react'

import { Draggable, DraggableProps } from './draggable'

export const withDraggable = (
	Component: FC,
	options?: WithDraggableOptions<
		Partial<Omit<DraggableProps, 'editor' | 'element' | 'children'>>
	>,
) =>
	withDraggablePrimitive<DraggableProps>(Draggable, Component, options as any)

export const withDraggablesPrimitive = createNodesWithHOC(withDraggable)

export const withDraggables = (components: any) => {
	return withDraggablesPrimitive(components, [
		{
			keys: [ELEMENT_PARAGRAPH, ELEMENT_UL, ELEMENT_OL],
			level: 0,
		},
		{
			key: ELEMENT_H1,
			draggableProps: {
				classNames: {
					gutterLeft: 'px-0 pb-1 text-[1.875em]',
					blockToolbarWrapper: 'h-[1.3em]',
				},
			},
		},
		{
			key: ELEMENT_H2,
			draggableProps: {
				classNames: {
					gutterLeft: 'px-0 pb-1 text-[1.5em]',
					blockToolbarWrapper: 'h-[1.3em]',
				},
			},
		},
		{
			key: ELEMENT_H3,
			draggableProps: {
				classNames: {
					gutterLeft: 'pt-[2px] px-0 pb-1 text-[1.25em]',
					blockToolbarWrapper: 'h-[1.3em]',
				},
			},
		},
		{
			keys: [ELEMENT_PARAGRAPH],
			draggableProps: {
				classNames: {
					gutterLeft: 'pt-[3px] px-0 pb-0',
				},
			},
		},
	])
}
