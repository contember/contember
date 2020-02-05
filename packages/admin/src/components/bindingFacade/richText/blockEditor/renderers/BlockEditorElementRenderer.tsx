import { RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlock } from '../../../blocks'
import { isContemberBlockElement } from '../ContemberBlockElement'
import { ContemberBlockElementRenderer } from './ContemberBlockElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	normalizedBlocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	fallbackRenderer: (props: RenderElementProps) => React.ReactElement
}

export const BlockEditorElementRenderer = React.memo(
	({ fallbackRenderer, ...props }: BlockEditorElementRendererProps) => {
		if (isContemberBlockElement(props.element)) {
			return (
				<ContemberBlockElementRenderer
					attributes={props.attributes}
					children={props.children}
					element={props.element}
					normalizedBlocks={props.normalizedBlocks}
					discriminationField={props.discriminationField}
				/>
			)
		}
		return fallbackRenderer(props)
	},
)
BlockEditorElementRenderer.displayName = 'BlockEditorElementRenderer'
