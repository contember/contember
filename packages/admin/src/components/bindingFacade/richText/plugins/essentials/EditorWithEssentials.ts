import * as React from 'react'
import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { EditorNode } from './Node'

export interface WithEssentials<E extends EditorNode> {
	formatVersion: string

	// <Editable> props
	renderElement: (props: RenderElementProps) => React.ReactElement
	renderLeaf: (props: RenderLeafProps) => React.ReactElement
	onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
	onFocus: (event: React.FocusEvent<HTMLDivElement>) => void
	onBlur: (event: React.FocusEvent<HTMLDivElement>) => void
}

export type EditorWithEssentials<E extends EditorNode> = WithEssentials<E> & EditorNode
