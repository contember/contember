import * as React from 'react'
import { Element as SlateElement, Node as SlateNode, NodeEntry } from 'slate'
import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { EditorNode, ElementNode, ElementSpecifics, SerializableEditorNode, TextNode, TextSpecifics } from './Node'

export interface WithEssentials<E extends EditorNode> {
	formatVersion: SerializableEditorNode['formatVersion']
	defaultElementType: string
	isDefaultElement: (element: SlateElement) => boolean
	createDefaultElement: (children: SlateElement['children']) => SlateElement
	insertBetweenBlocks: (blockEntry: NodeEntry, edge: 'before' | 'after') => void

	canToggleMarks: <T extends TextNode>(marks: TextSpecifics<T>) => boolean
	hasMarks: <T extends TextNode>(marks: TextSpecifics<T>) => boolean
	toggleMarks: <T extends TextNode>(marks: TextSpecifics<T>) => void

	canToggleElement: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean
	isElementActive: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean
	toggleElement: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => void

	canContainAnyFlowContent: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean
	isHeadingContent: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean
	isPhrasingContent: <E extends ElementNode>(elementType: E['type'], suchThat?: ElementSpecifics<E>) => boolean

	serializeNodes: (nodes: Array<ElementNode | TextNode>, errorMessage?: string) => string
	deserializeNodes: (serializedNodes: string, errorMessage?: string) => Array<ElementNode | TextNode>

	upgradeFormatBySingleVersion: (node: SlateNode, oldVersion: number) => SlateNode

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
