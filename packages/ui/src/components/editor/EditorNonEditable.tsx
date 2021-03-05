import cn from 'classnames'
import { ComponentType, createElement, HTMLAttributes, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'

export type EditorNonEditableProps =
	| (Omit<HTMLAttributes<HTMLSpanElement>, 'contentEditable'> & {
			children: ReactNode
			inline: true
	  })
	| (Omit<HTMLAttributes<HTMLDivElement>, 'contentEditable'> & {
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
