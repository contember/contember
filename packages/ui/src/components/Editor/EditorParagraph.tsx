import { useClassName } from '@contember/utilities'
import { createElement, ReactNode } from 'react'
import { HTMLParagraphElementProps } from '../../types'
import { toViewClass } from '../../utils'

export interface EditorParagraphProps {
	isNumbered?: boolean
	attributes: HTMLParagraphElementProps
	align?: 'start' | 'end' | 'center' | 'justify'
	children: ReactNode
}

export function EditorParagraph({ isNumbered, attributes, children, align }: EditorParagraphProps) {
	return createElement('p', {
		...attributes,
		style: {
			textAlign: align,
		},
		children,
		className: useClassName('editorParagraph', toViewClass('numbered', isNumbered)),
	})
}
