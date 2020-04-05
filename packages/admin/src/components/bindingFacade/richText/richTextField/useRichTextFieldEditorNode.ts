import { BindingError, FieldAccessor } from '@contember/binding'
import { BaseEditor, SerializableEditorNode } from '../baseEditor'

export interface UseRichTextFieldEditorNodeOptions {
	editor: BaseEditor
	fieldAccessor: FieldAccessor<string>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, SerializableEditorNode>
}

export const useRichTextFieldEditorNode = ({
	editor,
	fieldAccessor,
	contemberFieldElementCache,
}: UseRichTextFieldEditorNodeOptions): SerializableEditorNode => {
	if (contemberFieldElementCache.has(fieldAccessor)) {
		return contemberFieldElementCache.get(fieldAccessor)!
	}

	let element: SerializableEditorNode
	const fieldValue = fieldAccessor.currentValue
	if (typeof fieldValue !== 'string' && fieldValue !== null) {
		throw new BindingError(`RichTextField: the underlying field does not contain a string value.`)
	}

	if (fieldValue === null || fieldValue === '') {
		const editorElement: SerializableEditorNode = {
			formatVersion: editor.formatVersion,
			children: [editor.createDefaultElement([{ text: '' }])],
		}
		element = editorElement
	} else {
		try {
			element = JSON.parse(fieldValue)
		} catch (_) {
			throw new BindingError(`RichTextField: the underlying field contains invalid JSON.`)
		}
	}
	contemberFieldElementCache.set(fieldAccessor, element)

	return element
}
