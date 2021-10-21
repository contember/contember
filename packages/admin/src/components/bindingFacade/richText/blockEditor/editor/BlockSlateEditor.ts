import type { EntityAccessor, FieldValue } from '@contember/binding'
import type * as Slate from 'slate'
import { Editor as SlateEditor, Editor } from 'slate'
import type {
	ContemberContentPlaceholderElement,
	ContemberFieldElement,
	ElementWithReference,
	ReferenceElement,
} from '../elements'

export type BlockEditorElements = ReferenceElement | ContemberContentPlaceholderElement | ContemberFieldElement

export interface WithBlockElements {
	slate: typeof Slate
	isReferenceElement: (node: Slate.Node) => node is ReferenceElement
	isContemberContentPlaceholderElement: (node: Slate.Node) => node is ContemberContentPlaceholderElement
	isContemberFieldElement: (node: Slate.Node) => node is ContemberFieldElement
	createReferencedEntity: (blockIndex: number, initialize?: EntityAccessor.BatchUpdatesHandler) => void

	// Really, try to avoid passing just the referenceId at all costs
	getReferencedEntity: (elementOrReferenceId: ElementWithReference | string) => EntityAccessor
	prepareElementForInsertion: (element: Slate.Element) => Slate.Path
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

	unstable_diagnosticOperationLog: Slate.Operation[][]
}

export type EditorWithBlockElements<E extends SlateEditor> = E & WithBlockElements

export type BlockSlateEditor = Editor & EditorWithBlockElements<SlateEditor>
