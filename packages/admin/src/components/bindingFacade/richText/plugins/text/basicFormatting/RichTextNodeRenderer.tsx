import * as React from 'react'
import { RenderLeafProps } from 'slate-react'
import { RichTextNode } from './RichTextNode'

export interface RichTextNodeRendererProps extends Omit<RenderLeafProps, 'leaf' | 'text'> {
	leaf: RichTextNode
}

export const RichTextNodeRenderer: React.FunctionComponent<RichTextNodeRendererProps> = ({
	attributes,
	children,
	leaf,
}: RichTextNodeRendererProps) => {
	if (leaf.isCode) {
		children = <code>{children}</code>
	}
	if (leaf.isStruckThrough) {
		children = <s>{children}</s>
	}
	if (leaf.isUnderlined) {
		children = <u>{children}</u>
	}
	if (leaf.isItalic) {
		children = <i>{children}</i>
	}
	if (leaf.isBold) {
		children = <b>{children}</b>
	}
	return <span {...attributes}>{children}</span>
}
RichTextNodeRenderer.displayName = 'RichTextNodeRenderer'
