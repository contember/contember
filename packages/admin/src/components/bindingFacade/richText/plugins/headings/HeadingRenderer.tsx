import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { HeadingElement } from './HeadingElement'

export interface HeadingRendererProps extends Omit<RenderElementProps, 'element'> {
	element: HeadingElement
}

export const HeadingRenderer: React.FunctionComponent<HeadingRendererProps> = (props: HeadingRendererProps) =>
	React.createElement(`h${props.element.level}`, props.attributes, props.children)
HeadingRenderer.displayName = 'HeadingRenderer'
