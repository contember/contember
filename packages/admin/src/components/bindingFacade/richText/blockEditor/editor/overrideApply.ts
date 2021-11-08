import type { BindingOperations } from '@contember/binding'
import { EntityAccessor, EntityListAccessor, SugaredRelativeEntityList } from '@contember/binding'
import type { MutableRefObject } from 'react'
import { Element as SlateElement, Node, Operation } from 'slate'
import { isElementWithReference } from '../elements'
import type { EditorWithBlocks } from './EditorWithBlocks'

export interface OverrideApplyOptions {
	bindingOperations: BindingOperations
	isMutatingRef: MutableRefObject<boolean>
	createMonolithicReference: ((initialize: EntityAccessor.BatchUpdatesHandler) => void) | undefined
	referencesField: string | SugaredRelativeEntityList | undefined
	sortedBlocksRef: MutableRefObject<EntityAccessor[]>
}

export const overrideApply = <E extends EditorWithBlocks>(editor: E, options: OverrideApplyOptions) => {
	const { apply } = editor
	const { bindingOperations, isMutatingRef, createMonolithicReference, referencesField, sortedBlocksRef } = options

	editor.apply = (operation: Operation) => {
		if (operation.type === 'set_selection') {
			return apply(operation) // Nothing to do here
		}
		if (isMutatingRef.current) {
			return
		}

		const purgeElementReferences = (element: Node) => {
			if (!SlateElement.isElement(element)) {
				return
			}
			if (isElementWithReference(element)) {
				const referencedEntity = editor.getReferencedEntity(element)
				referencedEntity.deleteEntity()
			}
			for (const child of element.children) {
				purgeElementReferences(child)
			}
		}

		const moveReferences = (element: Node, from: EntityListAccessor, to: EntityListAccessor) => {
			if (!SlateElement.isElement(element)) {
				return
			}
			if (isElementWithReference(element)) {
				const reference = from.getChildEntityById(element.referenceId)
				to.connectEntity(reference)
				from.disconnectEntity(reference)
			}
			for (const child of element.children) {
				moveReferences(child, from, to)
			}
		}

		if (operation.type === 'remove_node') {
			bindingOperations.batchDeferredUpdates(() => {
				purgeElementReferences(operation.node)
			})
		} else if (operation.type === 'merge_node') {
			if (operation.path.length === 1 && !createMonolithicReference && referencesField) {
				bindingOperations.batchDeferredUpdates(() => {
					const previousBlock = sortedBlocksRef.current[operation.path[0]]
					const newBlock = sortedBlocksRef.current[operation.path[0] - 1]
					const previousReferences = previousBlock.getEntityList(referencesField)
					const newReferences = newBlock.getEntityList(referencesField)
					for (const reference of previousReferences) {
						newReferences.connectEntity(reference)
						previousReferences.disconnectEntity(reference)
					}
				})
			}
		} else if (operation.type === 'split_node') {
			// if (operation.path.length === 1 && !createMonolithicReference && referencesField) {
			// 	bindingOperations.batchDeferredUpdates(() => {
			// 		const previousBlock = sortedBlocksRef.current[operation.path[0]]
			// 		const newBlock = sortedBlocksRef.current[operation.path[0] + 1]
			// 		const [topLevelNode] = Editor.node(editor, operation.path)
			// 		if (!SlateElement.isElement(topLevelNode)) {
			// 			return
			// 		}
			// 		const previousReferences = previousBlock.getEntityList(referencesField)
			// 		const newReferences = newBlock.getEntityList(referencesField)
			// 		for (let i = operation.position; i < topLevelNode.children.length; i++) {
      //       const node = topLevelNode.children[i]
			// 			moveReferences(node, previousReferences, newReferences)
      //     }
			// 	})
			// }
			// TODO: clone references when splitting nodes!!
		}

		apply(operation)
	}
}
