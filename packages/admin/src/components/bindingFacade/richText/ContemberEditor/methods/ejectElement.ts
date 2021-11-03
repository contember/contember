import { Editor as SlateEditor, Element as SlateElement, Node as SlateNode, Path, Transforms } from 'slate'

export const ejectElement = <E extends SlateEditor>(editor: E, path: Path) => {
	const element = SlateNode.get(editor, path)

	if (!SlateElement.isElement(element)) {
		return
	}
	const { children, ...otherProperties } = element

	Transforms.unsetNodes(editor, Object.keys(otherProperties), {
		at: path,
	})
}
