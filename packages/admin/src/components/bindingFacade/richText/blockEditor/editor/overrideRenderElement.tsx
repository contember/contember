import { Editor } from 'slate'
import { ReactEditor } from 'slate-react'
import { ReferenceElementWrapper } from '../references/ReferenceElementWrapper'
import { isElementWithReference } from '../elements'

export const overrideRenderElement = (editor: Editor) => {
	const { renderElement } = editor

	editor.renderElement = props => {
		const children = renderElement(props)
		if (isElementWithReference(props.element)) {
			const path = ReactEditor.findPath(editor, props.element)
			return <ReferenceElementWrapper element={props.element} path={path}>{children}</ReferenceElementWrapper>
		}
		return children
	}
}
