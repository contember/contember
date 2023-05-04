import cn from 'classnames'
import { ComponentType, createElement, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'
import { HTMLDivElementProps, HTMLSpanElementProps } from '../../types'

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
export const EditorNonEditable: ComponentType<EditorNonEditableProps> = ({ inline, ...props }) =>
	createElement(inline ? 'span' : 'div', {
		...props,
		contentEditable: false,
		className: cn(`${useClassNamePrefix()}editorNonEditable`, toViewClass('inline', inline), props.className),
	})
EditorNonEditable.displayName = 'EditorNonEditable'
