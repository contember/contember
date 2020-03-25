import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import cn from 'classnames'
import { toViewClass } from '../../utils'

export type EditorNonEditableProps =
	| (Omit<React.HTMLAttributes<HTMLSpanElement>, 'contentEditable'> & {
			children: React.ReactNode
			inline: true
	  })
	| (Omit<React.HTMLAttributes<HTMLDivElement>, 'contentEditable'> & {
			children: React.ReactNode
			inline?: false
	  })

// TODO add this to storybook
export const EditorNonEditable: React.ComponentType<EditorNonEditableProps> = ({ inline, ...props }) =>
	React.createElement(inline ? 'span' : 'div', {
		...props,
		contentEditable: false,
		className: cn(`${useClassNamePrefix()}editorNonEditable`, toViewClass('inline', inline), props.className),
	})
EditorNonEditable.displayName = 'EditorNonEditable'
