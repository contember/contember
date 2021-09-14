import type { HistoryEditor } from 'slate-history'
import type { ReactEditor } from 'slate-react'
import type { Element as SlateElement, Text as SlateText, Editor as SlateEditor } from 'slate'

export type UnderlyingEditor = ReactEditor & HistoryEditor
export type BaseEditor = SlateEditor

export interface SerializableEditorNode {
	formatVersion: number
	children: Array<ElementNode | TextNode>
}

export type ElementSpecifics<Element extends SlateElement> = Omit<Element, 'type' | 'children' | 'referenceId'>
export type TextSpecifics<Text extends SlateText> = Omit<Text, 'text'>
export type ElementNode = SlateElement
export type EditorNode = SlateEditor
export type TextNode = SlateText
