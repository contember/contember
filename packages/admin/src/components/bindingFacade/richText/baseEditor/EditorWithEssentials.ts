import * as React from 'react'
import { Element as SlateElement } from 'slate'
import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { EditorNode, ElementNode, ElementSpecifics, TextNode, TextSpecifics } from './Node'

export interface WithEssentials<E extends EditorNode> {
	formatVersion: string
	defaultElementType: string
	isDefaultElement: (element: SlateElement) => boolean
	createDefaultElement: (children: SlateElement['children']) => SlateElement

	canToggleMarks: <T extends TextNode>(marks: TextSpecifics<T>) => boolean
	hasMarks: <T extends TextNode>(marks: TextSpecifics<T>) => boolean
	toggleMarks: <T extends TextNode>(marks: TextSpecifics<T>) => void

	canToggleElement: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean
	isElementActive: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean
	toggleElement: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => void

	// <Editable> props
	onDOMBeforeInput: (event: Event) => void
	renderElement: (props: RenderElementProps) => React.ReactElement
	renderLeaf: (props: RenderLeafProps) => React.ReactElement
	renderLeafChildren: (props: Omit<RenderLeafProps, 'attributes'>) => React.ReactElement
	onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
	onFocus: (event: React.FocusEvent<HTMLDivElement>) => void
	onBlur: (event: React.FocusEvent<HTMLDivElement>) => void
}

export type EditorWithEssentials<E extends EditorNode> = WithEssentials<E> & EditorNode
