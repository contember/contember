import { RichTextLeaf } from '../structure/index.js'
import { ComponentType, ReactElement } from 'react'
import { BuiltinLeaves } from '../builtin/index.js'

export type RenderLeafProps<CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
	formatVersion: number
	leaf: CustomLeaves & BuiltinLeaves
	fallback: ReactElement
	children: string
}

export type RenderLeaf<CustomLeaves extends RichTextLeaf> = ComponentType<RenderLeafProps<CustomLeaves>>
