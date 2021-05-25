import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react'
import type { Element as SlateElement, Node as SlateNode, NodeEntry } from 'slate'
import type { RenderElementProps, RenderLeafProps } from 'slate-react'
import type { EditorNode, ElementNode, ElementSpecifics, SerializableEditorNode, TextNode, TextSpecifics } from './Node'
import type { WithPaste } from './overrides'

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

	canContainAnyBlocks: (element: ElementNode) => boolean

	serializeNodes: (nodes: Array<ElementNode | TextNode>, errorMessage?: string) => string
	deserializeNodes: (serializedNodes: string, errorMessage?: string) => Array<ElementNode | TextNode>

	upgradeFormatBySingleVersion: (node: SlateNode, oldVersion: number) => SlateNode

	// <Editable> props
	onDOMBeforeInput: (event: Event) => void
	renderElement: (props: RenderElementProps) => ReactElement
	renderLeaf: (props: RenderLeafProps) => ReactElement
	renderLeafChildren: (props: Omit<RenderLeafProps, 'attributes'>) => ReactElement
	onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
	onFocus: (event: ReactFocusEvent<HTMLDivElement>) => void
	onBlur: (event: ReactFocusEvent<HTMLDivElement>) => void
}

export type EditorWithEssentials<E extends EditorNode> = WithEssentials<E> & WithPaste & EditorNode
