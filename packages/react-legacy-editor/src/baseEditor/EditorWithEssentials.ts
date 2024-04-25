import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent, ReactElement } from 'react'
import type {
	BaseEditor,
	Descendant,
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Text as SlateText,
} from 'slate'
import type { RenderElementProps, RenderLeafProps } from 'slate-react'
import type { TextSpecifics } from './Node'
import { CustomElementPlugin } from './CustomElementPlugin'
import { CustomMarkPlugin } from './CustomMarkPlugin'
import { HtmlDeserializer } from './html'

export type EditorDefaultElementFactory = (children: Descendant[]) => SlateElement;

export interface WithEssentials {
	formatVersion: number
	defaultElementType: string
	isDefaultElement: (element: SlateElement) => boolean
	createDefaultElement: EditorDefaultElementFactory
	insertBetweenBlocks: (blockEntry: NodeEntry, edge: 'before' | 'after') => void

	canToggleMarks: <T extends SlateText>(marks: TextSpecifics<T>) => boolean
	hasMarks: <T extends SlateText>(marks: TextSpecifics<T>) => boolean
	toggleMarks: <T extends SlateText>(marks: TextSpecifics<T>) => void

	canToggleElement: <E extends SlateElement>(elementType: E['type'], suchThat?: Partial<E>) => boolean
	isElementActive: <E extends SlateElement>(elementType: E['type'], suchThat?: Partial<E>) => boolean
	toggleElement: <E extends SlateElement>(elementType: E['type'], suchThat?: Partial<E>) => void
	acceptsAttributes: <E extends SlateElement>(elementType: E['type'], suchThat: Partial<E>) => boolean

	canContainAnyBlocks: (element: SlateElement | Editor) => boolean

	serializeNodes: (nodes: Array<Descendant>, errorMessage?: string) => string
	deserializeNodes: (serializedNodes: string, errorMessage?: string) => Array<SlateElement | SlateText>

	upgradeFormatBySingleVersion: (node: SlateNode, oldVersion: number) => SlateNode

	registerElement: (plugin: CustomElementPlugin<any>) => void
	registerMark: (plugin: CustomMarkPlugin) => void

	htmlDeserializer: HtmlDeserializer

	// <Editable> props
	renderElement: (props: RenderElementProps) => ReactElement
	renderLeaf: (props: RenderLeafProps) => ReactElement
	renderLeafChildren: (props: Omit<RenderLeafProps, 'attributes'>) => ReactElement
	onDOMBeforeInput: (event: Event) => void
	onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void
	onFocus: (event: ReactFocusEvent<HTMLDivElement>) => void
	onBlur: (event: ReactFocusEvent<HTMLDivElement>) => void
}

export type EditorWithEssentials<E extends BaseEditor> = WithEssentials & E
