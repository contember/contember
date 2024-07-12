import {
	BindingError,
	EntityAccessor,
	EntityId,
	SugaredFieldProps,
	useDesugaredRelativeSingleField,
} from '@contember/react-binding'
import { Descendant, Editor, Element as SlateElement, PathRef } from 'slate'

export interface UseBlockEditorSlateNodesOptions {
	editor: Editor
	blockElementCache: WeakMap<EntityAccessor, SlateElement>
	blockElementPathRefs: Map<EntityId, PathRef>
	blockContentField: SugaredFieldProps['field']
	topLevelBlocks: EntityAccessor[]
}

export const useBlockEditorSlateNodes = ({
	editor,
	blockElementCache,
	blockElementPathRefs,
	blockContentField,
	topLevelBlocks,
}: UseBlockEditorSlateNodesOptions): Descendant[] => {
	const desugaredContentField = useDesugaredRelativeSingleField(blockContentField)
	if (editor.operations.length) {
		// This is *ABSOLUTELY CRUCIAL*!
		//	Slate invokes the onChange callback asynchronously, and so it could happen that this hook is invoked whilst
		//	there are pending changes that the onChange routines haven't had a chance to let binding know about yet.
		//	In those situations, if this hook were to generate elements based on accessors, it would effectively
		//	prevent the pending changes from ever happening because Slate updates editor.children based on the value
		//	this hook generates and onChange in turn uses editor.children to update accessors.
		//	Consequently, whenever there are pending changes, we just return whatever children the editor already has
		//	because we know that an onChange is already scheduled.
		return editor.children
	}

	const topLevelBlockElements = topLevelBlocks.length
		? topLevelBlocks.map((entity, index) => {
				const existingBlockElement = blockElementCache.get(entity)

				const blockPathRef = blockElementPathRefs.get(entity.id)
				if (blockPathRef === undefined) {
					blockElementPathRefs.set(entity.id, Editor.pathRef(editor, [index], { affinity: 'backward' }))
				} else {
					const current = blockPathRef.current
					if (current === null || current.length !== 1 || current[0] !== index) {
						blockPathRef.unref()
						blockElementPathRefs.set(entity.id, Editor.pathRef(editor, [index], { affinity: 'backward' }))
					}
				}

				if (existingBlockElement) {
					return existingBlockElement
				}
				const contentField = entity.getRelativeSingleField(desugaredContentField)

				let blockElement: SlateElement

				if (contentField.value === null || contentField.value === '') {
					blockElement = editor.createDefaultElement([{ text: '' }])
				} else if (typeof contentField.value !== 'string') {
					throw new BindingError(`BlockEditor: The 'textBlockField' does not contain a string value.`)
				} else {
					blockElement = editor.deserializeNodes(
						contentField.value,
						`BlockEditor: The 'contentField' of a block contains invalid data.`,
					)[0] as SlateElement
				}
				blockElementCache.set(entity, blockElement)
				return blockElement
		  })
		: [
				editor.createDefaultElement([{ text: '' }]),
		  ]
	return topLevelBlockElements
}
