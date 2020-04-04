import { EditorNonEditable } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps, useSlate } from 'slate-react'
import { BaseEditor } from '../../../baseEditor'
import { EditorWithHeadings } from './EditorWithHeadings'
import { HeadingElement } from './HeadingElement'

export interface HeadingRendererProps extends Omit<RenderElementProps, 'element'> {
	element: HeadingElement
}

export const HeadingRenderer: React.FunctionComponent<HeadingRendererProps> = (props: HeadingRendererProps) => {
	const editor = useSlate() as EditorWithHeadings<BaseEditor>
	return React.createElement(
		`h${props.element.level}`,
		props.attributes,
		<>
			{props.element.isNumbered && (
				<EditorNonEditable
					inline
					style={{
						marginRight: '.5em',
					}}
				>
					{`${editor.getNumberedHeadingSection(props.element).join('.')}.`}
				</EditorNonEditable>
			)}
			{props.children}
		</>,
	)
}
HeadingRenderer.displayName = 'HeadingRenderer'
