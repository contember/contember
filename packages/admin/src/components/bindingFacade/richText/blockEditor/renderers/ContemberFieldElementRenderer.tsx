import { CSSProperties } from 'react'
import * as React from 'react'
import { Node as SlateNode } from 'slate'
import { RenderElementProps, useEditor } from 'slate-react'
import { ContemberFieldElement } from '../elements'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'

export interface ContemberFieldElementRendererProps extends RenderElementProps {
	element: ContemberFieldElement
	fieldBackedElement: NormalizedFieldBackedElement
}

const placeholderStyles: React.CSSProperties = {
	opacity: 0.333,
	width: '0',
	whiteSpace: 'nowrap',
	pointerEvents: 'none',
	display: 'inline-block',
}

export const ContemberFieldElementRenderer = React.memo((props: ContemberFieldElementRendererProps) => {
	const fieldString = SlateNode.string(props.element)
	const shouldDisplayPlaceholder = fieldString === ''
	return (
		<div {...props.attributes}>
			{props.fieldBackedElement.render({
				children: (
					<>
						{shouldDisplayPlaceholder && (
							<span contentEditable={false} style={placeholderStyles}>
								{props.fieldBackedElement.placeholder}
							</span>
						)}
						{props.children}
					</>
				),
			})}
		</div>
	)
})
ContemberFieldElementRenderer.displayName = 'ContemberFieldElementRenderer'
