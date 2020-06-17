import { RelativeSingleField, RemovalType } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlocks } from '../../../blocks'
import {
	isContemberBlockElement,
	isContemberContentPlaceholderElement,
	isContemberEmbedElement,
	isContemberFieldElement,
} from '../elements'
import { ContemberBlockElementRenderer } from './ContemberBlockElementRenderer'
import {
	BlockEditorGetEntityByKeyContext,
	BlockEditorGetNormalizedFieldBackedElementContext,
} from './ContemberElementRefreshContext'
import { ContemberEmbedElementRenderer } from './ContemberEmbedElementRenderer'
import { ContemberFieldElementRenderer } from './ContemberFieldElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	normalizedBlocks: NormalizedBlocks
	discriminationField: RelativeSingleField
	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks
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
	if (isContemberEmbedElement(props.element)) {
		const element = props.element
		return (
			<BlockEditorGetEntityByKeyContext.Consumer>
				{getEntityByKey => (
					<ContemberEmbedElementRenderer
						attributes={props.attributes}
						children={props.children}
						element={element}
						entity={getEntityByKey(element.entityKey)}
						embedSubBlocks={props.embedSubBlocks}
						embedContentDiscriminationField={props.embedContentDiscriminationField!}
					/>
				)}
			</BlockEditorGetEntityByKeyContext.Consumer>
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
