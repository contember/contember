import { createElement, FunctionComponent } from 'react'
import { RenderElementProps, useEditor } from 'slate-react'

export interface DefaultElementProps extends RenderElementProps {}

export const DefaultElement: FunctionComponent<DefaultElementProps> = ({ attributes, children, element }) => {
	const editor = useEditor()

	return createElement(editor.isInline(element) ? 'span' : 'div', attributes, children)
}
DefaultElement.displayName = 'DefaultElement'
