import { RichTextLeaf } from '../structure'
import { ComponentType, ReactElement } from 'react'
import { BuiltinLeaves } from '../builtin'

export type RenderLeafProps<CustomLeaves extends RichTextLeaf = RichTextLeaf> =
	& {
		formatVersion: number
		leaf: CustomLeaves & BuiltinLeaves
		fallback: ReactElement
		children: string
	}

export type RenderLeaf<CustomLeaves extends RichTextLeaf> = ComponentType<RenderLeafProps<CustomLeaves>>

