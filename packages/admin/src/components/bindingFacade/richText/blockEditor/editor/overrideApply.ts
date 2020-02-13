import {
	EntityAccessor,
	EntityListAccessor,
	FieldAccessor,
	FieldValue,
	RelativeEntityList,
	RelativeSingleField,
	RemovalType,
} from '@contember/binding'
import * as React from 'react'
import { Element, Operation } from 'slate'
import { NormalizedBlock } from '../../../blocks'
import { NormalizedFieldBackedElement } from '../FieldBackedElement'
import { applyBlockOperation } from './applyBlockOperation'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideApplyOptions {
	batchUpdates: EntityAccessor['batchUpdates']
	desugaredEntityList: RelativeEntityList
	discriminationField: RelativeSingleField
	entityListAccessorRef: React.MutableRefObject<EntityListAccessor>
	fieldElementCache: WeakMap<FieldAccessor, Element>
	isMutatingRef: React.MutableRefObject<boolean>
	normalizedBlocksRef: React.MutableRefObject<NormalizedBlock[]>
	normalizedLeadingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	normalizedTrailingFieldsRef: React.MutableRefObject<NormalizedFieldBackedElement[]>
	removalType: RemovalType
	sortableByField: RelativeSingleField
	sortedEntitiesRef: React.MutableRefObject<EntityAccessor[]>
	textBlockDiscriminant: FieldValue
	textBlockField: RelativeSingleField
	textElementCache: WeakMap<EntityAccessor, Element>
}

export const overrideApply = <E extends BlockSlateEditor>(editor: E, options: OverrideApplyOptions) => {
	const { apply } = editor
	editor.apply = (operation: Operation) => {
		if (operation.type === 'set_selection') {
			return apply(operation) // Nothing to do here
		}
		if (options.isMutatingRef.current) {
			return
		}
		if (operation.path.length === 0) {
			// Technically, the path could also be [], indicating that we're operating on the editor itself.
			// This is branch is entirely speculative. I *THINK* it could feasibly happen but I don't know when or how.
			return apply(operation) // ?!?!!???
		}

		const { path } = operation
		const [topLevelIndex] = path
		const firstContentIndex = options.normalizedLeadingFieldsRef.current.length

		// TODO also detect trailing from here
		if (topLevelIndex < firstContentIndex) {
			return
		}
		return applyBlockOperation(editor, apply, operation, options)
	}
}
