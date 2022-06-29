import cn from 'classnames'
import { createElement, HTMLAttributes, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'

export interface EditorParagraphProps {
	isNumbered?: boolean
	attributes: HTMLAttributes<HTMLParagraphElement>
	align?: 'start' | 'end' | 'center' | 'justify'
	children: ReactNode
}

export function EditorParagraph({ isNumbered, attributes, children, align }: EditorParagraphProps) {
	const prefix = useClassNamePrefix()
	return createElement('p', {
		...attributes,
		style: {
			textAlign: align,
		},
		children,
		className: cn(`${prefix}editorParagraph`, toViewClass('numbered', isNumbered)),
	})
}
