import { EditorTransforms, EditorWithBlocks, EntityAccessor } from '@contember/admin'

export const withAnchorsAsReference = (editor: EditorWithBlocks, { elementType, referenceType = elementType, updateReference }: {
	elementType: string,
	updateReference: (url: string, getAccessor: () => EntityAccessor) => void
	referenceType?: string,
}) => {
	const { normalizeNode } = editor
	editor.normalizeNode = ([element, path]) => {
		if ('type' in element && element.type === 'anchor' && 'href' in element && typeof element.href === 'string') {
			const referenceId = editor.createElementReference(path, referenceType, getAccessor => {
				updateReference(element.href as string, getAccessor)
			}).id
			return EditorTransforms.setNodes(editor, { referenceId, href: null, type: elementType }, { at: path })
		}
		normalizeNode([element, path])
	}
}
