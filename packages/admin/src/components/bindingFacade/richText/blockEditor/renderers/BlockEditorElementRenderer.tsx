import { RelativeSingleField, RemovalType } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlock } from '../../../blocks'
import { isContemberBlockElement, isContemberContentPlaceholderElement, isContemberFieldElement } from '../elements'
import { ContemberBlockElementRenderer } from './ContemberBlockElementRenderer'
import {
	BlockEditorGetEntityByKeyContext,
	BlockEditorGetNormalizedFieldBackedElementContext,
} from './ContemberElementRefreshContext'
import { ContemberFieldElementRenderer } from './ContemberFieldElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	normalizedBlocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	removalType: RemovalType
	fallbackRenderer: (props: RenderElementProps) => React.ReactElement
}

export const BlockEditorElementRenderer = ({ fallbackRenderer, ...props }: BlockEditorElementRendererProps) => {
	if (isContemberBlockElement(props.element)) {
		const element = props.element
		return (
			<BlockEditorGetEntityByKeyContext.Consumer>
				{getEntityByKey => (
					<ContemberBlockElementRenderer
						attributes={props.attributes}
						children={props.children}
						element={element}
						entity={getEntityByKey(element.entityKey)}
						normalizedBlocks={props.normalizedBlocks}
						removalType={props.removalType}
						discriminationField={props.discriminationField}
					/>
				)}
			</BlockEditorGetEntityByKeyContext.Consumer>
		)
	}
	if (isContemberFieldElement(props.element)) {
		const element = props.element
		return (
			<BlockEditorGetNormalizedFieldBackedElementContext.Consumer>
				{getNormalizedFieldBackedElement => (
					<ContemberFieldElementRenderer
						attributes={props.attributes}
						children={props.children}
						element={element}
						fieldBackedElement={getNormalizedFieldBackedElement(element)}
					/>
				)}
			</BlockEditorGetNormalizedFieldBackedElementContext.Consumer>
		)
	}
	if (isContemberContentPlaceholderElement(props.element)) {
		return (
			<div {...props.attributes}>
				<EditorPlaceholder>{props.element.placeholder}</EditorPlaceholder>
				{props.children}
			</div>
		)
	}
	return fallbackRenderer(props)
}
