import { EditorPlaceholder, ErrorList } from '@contember/ui'
import * as React from 'react'
import { Node as SlateNode } from 'slate'
import { RenderElementProps } from 'slate-react'
import { BlockElement } from '../../baseEditor'
import { ContemberFieldElement } from '../elements'

export interface ContemberFieldElementRendererProps extends RenderElementProps {
	element: ContemberFieldElement
}

export const ContemberFieldElementRenderer = React.memo((props: ContemberFieldElementRendererProps) => {
	const fieldString = SlateNode.string(props.element)
	const shouldDisplayPlaceholder = fieldString === ''
	return (
		<BlockElement attributes={props.attributes} element={props.element}>
			{props.children}
			{/*<div contentEditable={false}>*/}
			{/*	{props.fieldBackedElement.render({*/}
			{/*		isEmpty: shouldDisplayPlaceholder,*/}
			{/*		children: (*/}
			{/*			<div contentEditable={true}>*/}
			{/*				{shouldDisplayPlaceholder && (*/}
			{/*					<EditorPlaceholder>{props.fieldBackedElement.placeholder}</EditorPlaceholder>*/}
			{/*				)}*/}
			{/*				{props.children}*/}
			{/*			</div>*/}
			{/*		),*/}
			{/*	})}*/}
			{/*</div>*/}
			{/*{!!props.fieldBackedElement.accessor.errors.length && (*/}
			{/*	<div contentEditable={false} data-slate-editor={false}>*/}
			{/*		<ErrorList errors={props.fieldBackedElement.accessor.errors} size="small" />*/}
			{/*	</div>*/}
			{/*)}*/}
		</BlockElement>
	)
})
ContemberFieldElementRenderer.displayName = 'ContemberFieldElementRenderer'
