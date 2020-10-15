import { HistoryEditor } from 'slate-history'
import { ReactEditor } from 'slate-react'

// This is taken from https://github.com/Microsoft/TypeScript/issues/25987#issuecomment-441224690
type KnownKeys<T> = {
	[K in keyof T]: string extends K ? never : number extends K ? never : K
} extends { [_ in keyof T]: infer U }
	? {} extends U
		? never
		: U
	: never

export interface TextNode {
	text: string
}

export interface ElementNode {
	type?: string
	children: Array<ElementNode | TextNode>
}

export type UnderlyingEditor = ReactEditor & HistoryEditor

// We're effectively simply removing the index signature from Slate's original Editor type.
export type EditorNode = Omit<Pick<UnderlyingEditor, KnownKeys<UnderlyingEditor>>, 'children'> & {
	children: Array<TextNode | ElementNode>
}

export type SerializableEditorNode = {
	formatVersion: number
	children: Array<ElementNode | TextNode>
}

export type Node = EditorNode | ElementNode | TextNode

export type ElementSpecifics<Element extends ElementNode> = Omit<Element, 'type' | 'children'>
export type TextSpecifics<Text extends TextNode> = Omit<Text, 'text'>
