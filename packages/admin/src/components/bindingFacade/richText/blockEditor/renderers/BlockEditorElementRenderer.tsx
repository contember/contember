import { EntityAccessor, RelativeSingleField, RemovalType } from '@contember/binding'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlock } from '../../../blocks'
import { isContemberBlockElement } from '../elements'
import { ContemberBlockElementRefreshContext } from './ContemberBlockElementRefreshContext'
import { ContemberBlockElementRenderer } from './ContemberBlockElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	normalizedBlocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	removalType: RemovalType
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
						removalType={props.removalType}
						discriminationField={props.discriminationField}
					/>
				)}
			</ContemberBlockElementRefreshContext.Consumer>
		)
	}
	return fallbackRenderer(props)
}
