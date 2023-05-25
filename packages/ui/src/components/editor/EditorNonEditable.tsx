import { useClassName } from '@contember/utilities'
import { ComponentType, createElement, ReactNode } from 'react'
import { HTMLDivElementProps, HTMLSpanElementProps } from '../../types'
import { toViewClass } from '../../utils'

export type EditorNonEditableProps =
	| (Omit<HTMLSpanElementProps, 'contentEditable'> & {
		children: ReactNode
		inline: true
	})
	| (Omit<HTMLDivElementProps, 'contentEditable'> & {
		children: ReactNode
		inline?: false
	})

// TODO add this to storybook
export const EditorNonEditable: ComponentType<EditorNonEditableProps> = ({ inline, ...props }) => (
	createElement(inline ? 'span' : 'div', {
		...props,
		contentEditable: false,
		className: useClassName('editorNonEditable', [toViewClass('inline', inline), props.className]),
	})
)
EditorNonEditable.displayName = 'EditorNonEditable'
