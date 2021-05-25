import { BindingError, FieldAccessor } from '@contember/binding'
import type { BaseEditor, ElementNode } from '../baseEditor'

export interface UseRichTextFieldEditorNodeOptions {
	editor: BaseEditor
	fieldAccessor: FieldAccessor<string>
	contemberFieldElementCache: WeakMap<FieldAccessor<string>, ElementNode[]>
}

export const useRichTextFieldNodes = ({
	editor,
	fieldAccessor,
	contemberFieldElementCache,
}: UseRichTextFieldEditorNodeOptions): ElementNode[] => {
	if (contemberFieldElementCache.has(fieldAccessor)) {
		return contemberFieldElementCache.get(fieldAccessor)!
	}

	const fieldValue = fieldAccessor.value
	if (typeof fieldValue !== 'string' && fieldValue !== null) {
		throw new BindingError(`RichTextField: the underlying field does not contain a string value.`)
	}

	const elements: ElementNode[] =
		fieldValue === null || fieldValue === ''
			? [editor.createDefaultElement([{ text: '' }])]
			: [
					editor.createDefaultElement(
						editor.deserializeNodes(
							fieldValue,
							`RichTextField: the underlying field contains invalid JSON.`,
						) as ElementNode[],
					),
			  ]
	contemberFieldElementCache.set(fieldAccessor, elements)

	return elements
}
