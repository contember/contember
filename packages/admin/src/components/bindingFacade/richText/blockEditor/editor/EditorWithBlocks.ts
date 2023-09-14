import type { EntityAccessor, FieldValue } from '@contember/react-binding'
import type * as Slate from 'slate'
import { Editor } from 'slate'

export interface WithBlockElements {
	slate: typeof Slate

	getReferencedEntity: (referenceId: string) => EntityAccessor
	createElementReference: (
		targetPath: Slate.Path,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => EntityAccessor
	insertElementWithReference: <Element extends Slate.Element>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => void
}

export type EditorWithBlocks = Editor & WithBlockElements
