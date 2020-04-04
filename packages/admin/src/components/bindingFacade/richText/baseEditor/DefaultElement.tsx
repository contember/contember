import * as React from 'react'
import { RenderElementProps, useEditor } from 'slate-react'

export interface DefaultElementProps extends RenderElementProps {}

export const DefaultElement: React.FunctionComponent<DefaultElementProps> = ({ attributes, children, element }) => {
	const editor = useEditor()

	return React.createElement(editor.isInline(element) ? 'span' : 'div', attributes, children)
}
DefaultElement.displayName = 'DefaultElement'
