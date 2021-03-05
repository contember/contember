import cn from 'classnames'
import { createElement, HTMLAttributes, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'

export interface EditorParagraphProps {
	isNumbered?: boolean
	attributes: HTMLAttributes<HTMLParagraphElement>
	children: ReactNode
}

export function EditorParagraph({ isNumbered, attributes, children }: EditorParagraphProps) {
	const prefix = useClassNamePrefix()
	return createElement('p', {
		...attributes,
		children,
		className: cn(`${prefix}editorParagraph`, toViewClass('numbered', isNumbered)),
	})
}
