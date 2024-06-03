import { EditorElement, EditorPlugin } from '@contember/react-slate-editor-base'
import { ReactEditor } from 'slate-react'
import { ReactNode } from 'react'
import { Element, Transforms } from 'slate'

const createKey = () => Math.random().toString(36).slice(6)

export const withSortable = ({ render: Sortable }: {
	render: (props: { element: EditorElement, children: ReactNode }) => ReactNode
}): EditorPlugin => editor => {
	const { renderElement, normalizeNode } = editor

	editor.renderElement = props => {
		const path = ReactEditor.findPath(editor, props.element)
		if (path.length === 1) {
			return <Sortable element={props.element}>{renderElement(props)}</Sortable>
		}
		return renderElement(props)
	}

	editor.normalizeNode = entry => {
		const [node, path] = entry
		if (Element.isElement(node) && path.length === 1 && (!node.key || editor.children.findIndex(it => it !== node && it.key === node.key) !== -1)) {
			Transforms.setNodes(editor, {
				key: createKey(),
			}, { at: path })
		}
		normalizeNode(entry)
	}
}
