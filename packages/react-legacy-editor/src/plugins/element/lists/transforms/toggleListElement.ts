import { OrderedListElement, orderedListElementType } from '../OrderedListElement'
import { UnorderedListElement, unorderedListElementType } from '../UnorderedListElement'
import { Editor, Element as SlateElement, NodeEntry, Text, Transforms } from 'slate'
import { ContemberEditor } from '../../../../ContemberEditor'
import { listItemElementType } from '../ListItemElement'
import { isListElement } from '../ListElement'

export const toggleListElement = <T extends OrderedListElement | UnorderedListElement>(
	editor: Editor,
	elementType: T['type'],
	suchThat: Partial<T> | undefined,
	otherKindOfList: typeof orderedListElementType | typeof unorderedListElementType,
) => {
	if (editor.isElementActive(elementType, suchThat)) {
		const closestListEntry = ContemberEditor.closest(editor, {
			match: node => SlateElement.isElement(node) && node.type === elementType,
		}) as NodeEntry<UnorderedListElement | OrderedListElement>
		if (!closestListEntry) {
			return
		}
		return Editor.withoutNormalizing(editor, () => {
			const [closestList, closestListPath] = closestListEntry

			// It's important that we iterate backwards because otherwise we'd mangle the paths.
			// We unwrap elements which may have more than one child.
			for (let i = closestList.children.length - 1; i >= 0; i--) {
				const currentItemPath = [...closestListPath, i]
				if (Editor.hasInlines(editor, closestList.children[i] as SlateElement)) {
					Transforms.wrapNodes(editor, editor.createDefaultElement([]), {
						at: currentItemPath,
					})
					Transforms.unwrapNodes(editor, {
						at: [...currentItemPath, 0],
					})
				} else {
					Transforms.unwrapNodes(editor, { at: currentItemPath })
				}
			}
			Transforms.unwrapNodes(editor, { at: closestListPath })
		})
	}
	if (editor.isElementActive(elementType) || editor.isElementActive(otherKindOfList)) {
		// We're in a list but a different one. Note the lack of 'suchThat'
		const closestListEntry = ContemberEditor.closest(editor, {
			match: node => isListElement(node),
		}) as NodeEntry<UnorderedListElement | OrderedListElement>
		if (!closestListEntry) {
			return
		}
		return Editor.withoutNormalizing(editor, () => {
			const [, closestListPath] = closestListEntry
			ContemberEditor.ejectElement(editor, closestListPath)
			Transforms.setNodes(editor, { ...suchThat, type: elementType }, { at: closestListPath })
		})
	}

	const selection = editor.selection

	if (!selection) {
		return
	}

	const closestViableParentEntry = ContemberEditor.closestViableBlockContainerEntry(editor)

	if (!closestViableParentEntry) {
		return
	}

	Editor.withoutNormalizing(editor, () => {
		const [targetParent, targetParentPath] = closestViableParentEntry

		if (SlateElement.isElement(targetParent) && Editor.hasInlines(editor, targetParent)) {
			// We're deliberately widening the selection to include all the inlines.
			const listItemPath = [...targetParentPath, 0]

			// Not using wrapNodes because it appears to exhibit rather unpredictable treatment of text nodes.
			Transforms.insertNodes(editor, { type: listItemElementType, children: [] }, { at: listItemPath })
			Transforms.moveNodes(editor, {
				to: [...listItemPath, 0],
				match: node => Text.isText(node) || Editor.isInline(editor, node),
				at: {
					anchor: Editor.start(editor, [...targetParentPath, 1]),
					focus: Editor.end(editor, [...targetParentPath, targetParent.children.length]),
				},
			})
			Transforms.wrapNodes(editor, { type: elementType, children: [] }, { at: listItemPath })
		} else {
			const [selectionStart, selectionEnd] = Editor.edges(editor, selection)
			const relativeStartIndex = selectionStart.path[targetParentPath.length]
			const relativeEndIndex = selectionEnd.path[targetParentPath.length]

			for (let i = relativeStartIndex; i <= relativeEndIndex; i++) {
				Transforms.wrapNodes(editor, { type: listItemElementType, children: [] }, { at: [...targetParentPath, i] })
			}

			const emptyList: UnorderedListElement | OrderedListElement = {
				...suchThat,
				type: elementType as (UnorderedListElement | OrderedListElement)['type'],
				children: [],
			}
			const listPath = [...targetParentPath, relativeStartIndex]
			Transforms.insertNodes(editor, emptyList, { at: listPath })

			for (let i = relativeStartIndex; i <= relativeEndIndex; i++) {
				Transforms.moveNodes(editor, {
					to: [...listPath, i - relativeStartIndex],
					// The path doesn't depend on i because we keep moving the siblings away.
					at: [...targetParentPath, relativeStartIndex + 1],
				})
			}
		}
	})
}
