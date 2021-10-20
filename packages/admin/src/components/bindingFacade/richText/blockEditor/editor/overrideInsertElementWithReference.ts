import {
	addEntityAtIndex,
	BindingOperations,
	EntityAccessor,
	FieldValue,
	RelativeEntityList,
	RelativeSingleField,
} from '@contember/binding'
import type { MutableRefObject } from 'react'
import { Editor, PathRef, Transforms } from 'slate'
import type { ElementNode } from '../../baseEditor'
import type { ElementWithReference } from '../elements'
import type { FieldBackedElement } from '../FieldBackedElement'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertElementWithReferenceOptions {
	bindingOperations: BindingOperations
	blockContentField: RelativeSingleField
	blockElementCache: WeakMap<EntityAccessor, ElementNode>
	blockElementPathRefs: Map<string, PathRef>
	createMonolithicReference: ((initialize: EntityAccessor.BatchUpdatesHandler) => void) | undefined
	desugaredBlockList: RelativeEntityList
	getParentEntityRef: MutableRefObject<EntityAccessor.GetEntityAccessor>
	leadingFields: FieldBackedElement[]
	referenceDiscriminationField: RelativeSingleField | undefined
	sortableByField: RelativeSingleField
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideInsertElementWithReference = <E extends BlockSlateEditor>(
	editor: E,
	options: OverrideInsertElementWithReferenceOptions,
) => {
	const {
		bindingOperations,
		blockContentField,
		blockElementCache,
		blockElementPathRefs,
		createMonolithicReference,
		desugaredBlockList,
		getParentEntityRef,
		leadingFields,
		referenceDiscriminationField,
		sortableByField,
		sortedBlocksRef,
	} = options
	if (referenceDiscriminationField === undefined) {
		return
	}
	editor.insertElementWithReference = <Element extends ElementNode>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => {
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = editor.prepareElementForInsertion(element as Element)
			const [topLevelElementIndex] = preppedPath
			const blockOrder = topLevelElementIndex - leadingFields.length
			let newBlockId: string | undefined = undefined

			if (preppedPath.length === 1 && !createMonolithicReference) {
				// We're creating a top-level block and aren't in monolithic mode.
				// Hence we need to first create the block entity.
				bindingOperations.batchDeferredUpdates(() => {
					getParentEntityRef.current().batchUpdates(getAccessor => {
						const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)
						addEntityAtIndex(blockList, sortableByField, blockOrder, getNewBlock => {
							newBlockId = getNewBlock().id
							sortedBlocksRef.current.splice(blockOrder, 0, getNewBlock())
						})
					})
				})
			}
			const referenceId = editor.createElementReference(preppedPath, referenceDiscriminant, initialize)
			const newNode: ElementWithReference = { ...(element as Element), referenceId }
			Transforms.insertNodes(editor, newNode, { at: preppedPath })

			if (preppedPath.length === 1 && !createMonolithicReference && newBlockId !== undefined) {
				bindingOperations.batchDeferredUpdates(() => {
					getParentEntityRef.current().batchUpdates(getAccessor => {
						const blockList = getAccessor().getRelativeEntityList(desugaredBlockList)

						blockElementPathRefs.set(
							newBlockId!,
							Editor.pathRef(editor, [topLevelElementIndex], { affinity: 'backward' }),
						)
						blockList
							.getChildEntityById(newBlockId!)
							.getRelativeSingleField(blockContentField)
							.updateValue(editor.serializeNodes([newNode]))
						blockElementCache.set(blockList.getChildEntityById(newBlockId!), newNode)
						sortedBlocksRef.current.splice(blockOrder, 1, blockList.getChildEntityById(newBlockId!))
					})
				})
			}
		})
	}
}
