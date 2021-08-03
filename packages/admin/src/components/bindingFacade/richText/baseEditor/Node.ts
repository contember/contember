import type { HistoryEditor } from 'slate-history'
import type { ReactEditor } from 'slate-react'

export interface TextNode {
	text: string
}

export interface ElementNode {
	type?: string
	referenceId?: string
	children: Array<ElementNode | TextNode>
}

export type UnderlyingEditor = ReactEditor & HistoryEditor
export type KnownEditorKeys =
	| 'addMark'
	| 'apply'
	| 'deleteBackward'
	| 'deleteForward'
	| 'deleteFragment'
	| 'history'
	| 'insertBreak'
	| 'insertData'
	| 'insertFragment'
	| 'insertNode'
	| 'insertText'
	| 'isInline'
	| 'isVoid'
	| 'marks'
	| 'normalizeNode'
	| 'onChange'
	| 'operations'
	| 'redo'
	| 'removeMark'
	| 'selection'
	| 'undo'
// We're effectively simply removing the index signature from Slate's original Editor type.
export type EditorNode = Pick<UnderlyingEditor, KnownEditorKeys> & {
	type?: never
	children: Array<TextNode | ElementNode>
}

export interface SerializableEditorNode {
	formatVersion: number
	children: Array<ElementNode | TextNode>
}

export type Node = EditorNode | ElementNode | TextNode

export type ElementSpecifics<Element extends ElementNode> = Omit<Element, 'type' | 'children' | 'referenceId'>
export type TextSpecifics<Text extends TextNode> = Omit<Text, 'text'>
