import type { Element as SlateElement, Text as SlateText } from 'slate'

export interface SerializableEditorNode {
	formatVersion: number
	children: Array<SlateElement | SlateText>
}

export type TextSpecifics<Text extends SlateText> = Omit<Text, 'text'>
