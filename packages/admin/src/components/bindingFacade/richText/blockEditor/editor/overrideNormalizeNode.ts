import { ReactNode } from 'react'
import { Node as SlateNode, Path as SlatePath, Text, Transforms } from 'slate'
import { EditorNode } from '../../baseEditor'
import { ContemberEditor } from '../../ContemberEditor'
import {
	ContemberContentPlaceholderElement,
	contemberContentPlaceholderType,
	ContemberFieldElement,
	contemberFieldElementType,
	isElementWithReference,
} from '../elements'
import { FieldBackedElement } from '../FieldBackedElement'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideNormalizeNodeOptions {
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
	placeholder: ContemberContentPlaceholderElement['placeholder']
}

export const overrideNormalizeNode = <E extends BlockSlateEditor>(
	editor: E,
	{ leadingFields, trailingFields, placeholder }: OverrideNormalizeNodeOptions,
) => {
	const { normalizeNode } = editor

	editor.normalizeNode = nodeEntry => {
		const [node, path] = nodeEntry

		if (Text.isText(node)) {
			return normalizeNode(nodeEntry)
		}
		if (path.length === 0) {
			// This is the editor
			const leadingCount = leadingFields.length
			const trailingCount = trailingFields.length

			for (let i = 0; i < leadingCount; i++) {
				const childPath = path.concat(i)
				if (editor.children.length <= i) {
					Transforms.insertNodes(editor, createNewFieldElement(), { at: childPath })
				}
				if (!editor.isContemberFieldElement(editor.children[i])) {
					ContemberEditor.ejectElement(editor, childPath)
					Transforms.setNodes(editor, { type: contemberFieldElementType }, { at: childPath })
				}
				normalizeFieldBackedElement(editor, leadingFields[i], editor.children[i] as ContemberFieldElement, childPath)
			}

			// Trailing are a bit more complex if we want to maintain backward affinity.
			const remainingChildrenCount = editor.children.length - leadingCount
			for (let i = remainingChildrenCount; i < trailingCount; i++) {
				Transforms.insertNodes(editor, createNewFieldElement(), { at: path.concat(leadingCount + i) })
			}
			for (let i = 0; i < trailingCount; i++) {
				const index = editor.children.length - 1 - i
				const childPath = path.concat(index)

				if (!editor.isContemberFieldElement(editor.children[index])) {
					ContemberEditor.ejectElement(editor, childPath)
					Transforms.setNodes(editor, { type: contemberFieldElementType }, { at: childPath })
				}
				normalizeFieldBackedElement(
					editor,
					trailingFields[i],
					editor.children[index] as ContemberFieldElement,
					childPath,
				)
			}
			if (editor.children.length === leadingCount + trailingCount) {
				insertPlaceholderAt(editor, placeholder, path.concat(leadingCount))
			} else {
				for (let i = leadingCount; i < editor.children.length - trailingCount; i++) {
					const child = editor.children[i]
					if (editor.isContemberContentPlaceholderElement(child)) {
						if (i > leadingCount) {
							ejectPlaceholder(editor, path.concat(i))
						}
					} else if (editor.isContemberFieldElement(child)) {
						const childPath = path.concat(i)
						Transforms.wrapNodes(editor, editor.createDefaultElement([{ text: '' }]), {
							at: childPath,
						})
						Transforms.unwrapNodes(editor, { at: childPath.concat(0) })
					}
				}
			}
			if (editor.children.length === leadingCount + trailingCount + 1) {
				const soleBlock = editor.children[leadingCount] as EditorNode
				if (editor.isDefaultElement(soleBlock) && SlateNode.string(soleBlock) === '') {
					const targetPath = path.concat(leadingCount)
					Transforms.removeNodes(editor, { at: targetPath })
					insertPlaceholderAt(editor, placeholder, targetPath)
				}
			}

			return normalizeNode(nodeEntry)
		}
		if (editor.isContemberContentPlaceholderElement(node)) {
			if (
				path.length !== 1 || // Can only appear at the top-level…
				path[0] !== leadingFields.length || // …right after leading fields
				node.children.length !== 1 ||
				!Text.isText(node.children[0]) ||
				node.children[0].text !== ''
			) {
				// If the placeholder is anywhere but where it's supposed to be or if there's some text in it,
				// convert it into a default element.
				ejectPlaceholder(editor, path)
			}
		} else if (editor.isContemberFieldElement(node)) {
			if (path.length !== 1) {
				Transforms.wrapNodes(editor, editor.createDefaultElement([{ text: '' }]), {
					at: path,
				})
				Transforms.unwrapNodes(editor, { at: path.concat(0) })
			}
		} else if (isElementWithReference(node)) {
			const referenceId = node.referenceId
			const deleteNode = () => {
				console.warn(`Removing a node linking a non-existent reference id '${referenceId}'.`)
				Transforms.delete(editor, { at: path })
			}
			try {
				editor.getReferencedEntity(node)
			} catch {
				deleteNode()
			}
		}
		return normalizeNode(nodeEntry)
	}
}

const createNewFieldElement = (children: SlateNode[] = [{ text: '' }]) => ({
	type: contemberFieldElementType,
	children,
})

const normalizeFieldBackedElement = <E extends BlockSlateEditor>(
	editor: E,
	element: FieldBackedElement,
	node: ContemberFieldElement,
	path: SlatePath,
) => {
	if (element.format === 'plainText' && (node.children.length !== 1 || !Text.isText(node.children[0]))) {
		const content = SlateNode.string(node)
		Transforms.removeNodes(editor, {
			at: path,
		})
		Transforms.insertNodes(editor, createNewFieldElement([{ text: content }]), {
			at: path,
		})
	}
}

const ejectPlaceholder = <E extends BlockSlateEditor>(editor: E, path: SlatePath) => {
	const properties = {
		type: editor.defaultElementType,
		placeholder: null,
	}
	editor.apply({
		type: 'set_node',
		path: path,
		newProperties: properties,
		properties,
	})
}

const insertPlaceholderAt = <E extends BlockSlateEditor>(editor: E, placeholder: ReactNode, path: SlatePath) => {
	Transforms.insertNodes(
		editor,
		{
			type: contemberContentPlaceholderType,
			children: [{ text: '' }],
			placeholder,
		},
		{ at: path },
	)
}
