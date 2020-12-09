import { BindingOperations, EntityListAccessor } from '@contember/binding'
import * as React from 'react'
import { Element as SlateElement, Operation } from 'slate'
import { ElementNode, TextNode } from '../../baseEditor'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideApplyOptions {
	bindingOperations: BindingOperations
	getReferenceByKey: EntityListAccessor.GetChildEntityByKey | undefined
	isMutatingRef: React.MutableRefObject<boolean>
}

export const overrideApply = <E extends BlockSlateEditor>(editor: E, options: OverrideApplyOptions) => {
	const { apply } = editor
	const { bindingOperations, isMutatingRef, getReferenceByKey } = options

	editor.apply = (operation: Operation) => {
		if (operation.type === 'set_selection') {
			return apply(operation) // Nothing to do here
		}
		if (isMutatingRef.current) {
			return
		}

		const purgeElementReferences = (element: ElementNode | TextNode) => {
			if (!SlateElement.isElement(element)) {
				return
			}
			if ('referenceId' in element && element.referenceId !== undefined && getReferenceByKey) {
				const referencedEntity = getReferenceByKey(element.referenceId)
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
