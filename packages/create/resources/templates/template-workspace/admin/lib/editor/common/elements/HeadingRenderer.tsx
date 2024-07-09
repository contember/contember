import { HeadingElement } from '@contember/react-slate-editor-base'
import React, { FunctionComponent } from 'react'
import type { RenderElementProps } from 'slate-react'
import { cn } from '../../../utils'

export interface HeadingRendererProps extends Omit<RenderElementProps, 'element'> {
	element: HeadingElement
}

const lvlToHtmlEl = {
	1: 'h1',
	2: 'h2',
	3: 'h3',
	4: 'h4',
	5: 'h5',
	6: 'h6',
}

const lvlToTailwindClassname = {
	1: 'text-3xl',
	2: 'text-2xl',
	3: 'text-xl',
	4: 'text-lg',
	5: 'text-base',
	6: 'text-sm',
}

export const HeadingRenderer: FunctionComponent<HeadingRendererProps> = ({
	attributes,
	element,
	children,
}: HeadingRendererProps) => {
	const el = lvlToHtmlEl[element.level]

	// todo numbered element.isNumbered
	return  React.createElement(
		el,
		{
			...attributes,
			className: cn(lvlToTailwindClassname[element.level]),
			style: {
				textAlign: element.align,
			},
		},
		children,
	)
}
HeadingRenderer.displayName = 'HeadingRenderer'
