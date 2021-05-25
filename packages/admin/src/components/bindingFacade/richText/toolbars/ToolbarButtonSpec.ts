import type { EntityAccessor } from '@contember/binding'
import type { IconSourceSpecification } from '@contember/ui'
import type { FunctionComponent, ReactNode } from 'react'
import type { Range as SlateRange } from 'slate'
import type { SugaredDiscriminateBy } from '../../discrimination'
import type { ElementNode, ElementSpecifics, TextNode, TextSpecifics } from '../baseEditor'
import type { BlockSlateEditor } from '../blockEditor'

export interface MarkSpecificToolbarButton<T extends TextNode> {
	marks: TextSpecifics<T>
}

export interface ElementSpecificToolbarButton<E extends ElementNode> {
	elementType: E['type']
	suchThat?: ElementSpecifics<E>
}

export interface InitializeReferenceContentProps {
	referenceId: string
	editor: BlockSlateEditor
	selection: SlateRange | null
	onSuccess: () => void
	onCancel: () => void
}
export interface InitializeReferenceSpecificToolbarButton {
	discriminateBy: SugaredDiscriminateBy
	initializeReference?: EntityAccessor.BatchUpdatesHandler
	referenceContent: FunctionComponent<InitializeReferenceContentProps>
}

export interface CommonToolbarButton extends IconSourceSpecification {
	label: ReactNode
	title?: string
}

export type ElementToolbarButton<E extends ElementNode> = CommonToolbarButton & ElementSpecificToolbarButton<E>
export type MarkToolbarButton<T extends TextNode> = CommonToolbarButton & MarkSpecificToolbarButton<T>
export type InitializeReferenceToolbarButton = CommonToolbarButton & InitializeReferenceSpecificToolbarButton

export type ToolbarButtonSpec = ElementToolbarButton<any> | MarkToolbarButton<any> | InitializeReferenceToolbarButton
