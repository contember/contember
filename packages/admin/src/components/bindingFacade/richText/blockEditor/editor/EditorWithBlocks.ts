import type { EntityAccessor, FieldValue } from '@contember/binding'
import type * as Slate from 'slate'
import { Editor as SlateEditor, Editor } from 'slate'
import type { ElementWithReference } from '../elements'

export interface WithBlockElements {
	slate: typeof Slate

	// Really, try to avoid passing just the referenceId at all costs
	getReferencedEntity: (elementOrReferenceId: ElementWithReference | string) => EntityAccessor
	createElementReference: (
		targetPath: Slate.Path,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => string
	insertElementWithReference: <Element extends Slate.Element>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => void
	slateOnChange: () => void
}

export type EditorWithBlocks = Editor & WithBlockElements
