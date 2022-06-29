import type { EntityAccessor, EntityId } from '@contember/binding'
import type { IconSourceSpecification } from '@contember/ui'
import type { FunctionComponent, ReactNode } from 'react'
import type { Range as SlateRange } from 'slate'
import { Editor, Element as SlateElement, Text as SlateText } from 'slate'
import type { SugaredDiscriminateBy } from '../../discrimination'
import type { TextSpecifics } from '../baseEditor'
import type { EditorWithBlocks } from '../blockEditor'

export interface MarkSpecificToolbarButton<T extends SlateText> {
	marks: TextSpecifics<T>
}

export interface ElementSpecificToolbarButton<E extends SlateElement> {
	elementType: E['type']
	suchThat?: Partial<E>
}

export interface InitializeReferenceContentProps {
	referenceId: EntityId
	editor: EditorWithBlocks
	selection: SlateRange | null
	onSuccess: (options?: { createElement?: Partial<SlateElement> }) => void
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

export type GenericToolbarButton =
	& CommonToolbarButton
	& {
		isActive?: (args: { editor: Editor }) => boolean
		shouldDisplay?: (args: { editor: Editor }) => boolean
		toggle: (args: { editor: Editor }) => void
	}

export type ElementToolbarButton<E extends SlateElement> = CommonToolbarButton & ElementSpecificToolbarButton<E>
export type MarkToolbarButton<T extends SlateText> = CommonToolbarButton & MarkSpecificToolbarButton<T>
export type InitializeReferenceToolbarButton = CommonToolbarButton & InitializeReferenceSpecificToolbarButton

export type ToolbarButtonSpec =
	| ElementToolbarButton<any>
	| MarkToolbarButton<any>
	| InitializeReferenceToolbarButton
	| GenericToolbarButton
