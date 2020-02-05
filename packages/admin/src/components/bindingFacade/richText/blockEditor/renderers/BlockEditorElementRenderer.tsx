import { EntityAccessor, RelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlock } from '../../../blocks'
import { isContemberBlockElement } from '../ContemberBlockElement'
import { ContemberBlockElementRenderer } from './ContemberBlockElementRenderer'
import { ContemberBlockElementRefreshContext } from './ContemberBlockElementRefreshContext'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	normalizedBlocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	fallbackRenderer: (props: RenderElementProps) => React.ReactElement
	getEntityByKey: (key: string) => EntityAccessor
}

export const BlockEditorElementRenderer = ({ fallbackRenderer, ...props }: BlockEditorElementRendererProps) => {
	if (isContemberBlockElement(props.element)) {
		const element = props.element
		return (
			<ContemberBlockElementRefreshContext.Consumer>
				{() => (
					<ContemberBlockElementRenderer
						attributes={props.attributes}
						children={props.children}
						element={element}
						entity={props.getEntityByKey(element.entityKey)}
						normalizedBlocks={props.normalizedBlocks}
						discriminationField={props.discriminationField}
					/>
				)}
			</ContemberBlockElementRefreshContext.Consumer>
		)
	}
	return fallbackRenderer(props)
}
