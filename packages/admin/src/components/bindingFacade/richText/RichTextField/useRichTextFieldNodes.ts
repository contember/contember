import { BindingError, FieldAccessor } from '@contember/react-binding'
import { Descendant, Editor } from 'slate'

export interface UseRichTextFieldEditorNodeOptions {
	editor: Editor
	fieldAccessor: FieldAccessor<string>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, Descendant[]>
}

export const useRichTextFieldNodes = ({
	editor,
	fieldAccessor,
	contemberFieldElementCache,
}: UseRichTextFieldEditorNodeOptions): Descendant[] => {
	if (contemberFieldElementCache.has(fieldAccessor)) {
		return contemberFieldElementCache.get(fieldAccessor)!
	}

	const fieldValue = fieldAccessor.value
	if (typeof fieldValue !== 'string' && fieldValue !== null) {
		throw new BindingError(`RichTextField: the underlying field does not contain a string value.`)
	}

	const elements: Descendant[] =
		fieldValue === null || fieldValue === ''
			? [editor.createDefaultElement([{ text: '' }])]
			: [
					editor.createDefaultElement(
						editor.deserializeNodes(
							fieldValue,
							`RichTextField: the underlying field contains invalid JSON.`,
						) as Descendant[],
					),
			  ]
	contemberFieldElementCache.set(fieldAccessor, elements)

	return elements
}
