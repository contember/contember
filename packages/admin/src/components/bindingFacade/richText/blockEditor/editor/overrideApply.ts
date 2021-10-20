import type { BindingOperations } from '@contember/binding'
import type { MutableRefObject } from 'react'
import { Element as SlateElement, Node, Operation } from 'slate'
import type { ElementNode, TextNode } from '../../baseEditor'
import { isElementWithReference } from '../elements'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideApplyOptions {
	bindingOperations: BindingOperations
	isMutatingRef: MutableRefObject<boolean>
}

export const overrideApply = <E extends BlockSlateEditor>(editor: E, options: OverrideApplyOptions) => {
	const { apply } = editor
	const { bindingOperations, isMutatingRef } = options

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

		if (operation.type === 'remove_node') {
			bindingOperations.batchDeferredUpdates(() => {
				purgeElementReferences(operation.node)
			})
		} else if (operation.type === 'merge_node') {
			// TODO What exactly should be done from here?
			//purgeElementReferences(SlateNode.get(editor, path))
		} else if (operation.type === 'split_node') {
			// TODO: clone references when splitting nodes!!
		}

		apply(operation)
	}
}
