import { EntityAccessor, RelativeSingleField, RemovalType } from '@contember/binding'
import { EditorPlaceholder } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { NormalizedBlock } from '../../../blocks'
import {
	ContemberFieldElement,
	isContemberBlockElement,
	isContemberContentPlaceholderElement,
	isContemberFieldElement,
} from '../elements'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { ContemberBlockElementRenderer } from './ContemberBlockElementRenderer'
import { ContemberElementRefreshContext } from './ContemberElementRefreshContext'
import { ContemberFieldElementRenderer } from './ContemberFieldElementRenderer'

export interface BlockEditorElementRendererProps extends RenderElementProps {
	normalizedBlocks: NormalizedBlock[]
	discriminationField: RelativeSingleField
	removalType: RemovalType
	fallbackRenderer: (props: RenderElementProps) => React.ReactElement
	getEntityByKey: (key: string) => EntityAccessor
	getNormalizedFieldBackedElement: (element: ContemberFieldElement) => NormalizedFieldBackedElement
}

export const BlockEditorElementRenderer = ({ fallbackRenderer, ...props }: BlockEditorElementRendererProps) => {
	if (isContemberBlockElement(props.element)) {
		const element = props.element
		return (
			<ContemberElementRefreshContext.Consumer>
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
			</ContemberElementRefreshContext.Consumer>
		)
	}
	if (isContemberFieldElement(props.element)) {
		const element = props.element
		return (
			<ContemberElementRefreshContext.Consumer>
				{() => (
					<ContemberFieldElementRenderer
						attributes={props.attributes}
						children={props.children}
						element={element}
						fieldBackedElement={props.getNormalizedFieldBackedElement(element)}
					/>
				)}
			</ContemberElementRefreshContext.Consumer>
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
