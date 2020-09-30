import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'

export interface EditorParagraphProps {
	isNumbered?: boolean
	attributes: React.HTMLAttributes<HTMLParagraphElement>
	children: React.ReactNode
}

export function EditorParagraph({ isNumbered, attributes, children }: EditorParagraphProps) {
	const prefix = useClassNamePrefix()
	return React.createElement('p', {
		...attributes,
		children,
		className: cn(`${prefix}editorParagraph`, toViewClass('numbered', isNumbered)),
	})
}
