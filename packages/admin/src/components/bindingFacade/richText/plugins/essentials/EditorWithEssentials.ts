import * as React from 'react'
import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { EditorNode } from './Node'

export interface WithEssentials<E extends EditorNode> {
	formatVersion: string
	renderElement: (props: RenderElementProps) => React.ReactElement
	renderLeaf: (props: RenderLeafProps) => React.ReactElement
}

export type EditorWithEssentials<E extends EditorNode> = WithEssentials<E> & EditorNode
