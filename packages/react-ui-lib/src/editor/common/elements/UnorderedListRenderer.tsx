import { RenderElementProps } from 'slate-react'
import { FunctionComponent } from 'react'
import { UnorderedListElement } from '@contember/react-slate-editor-base'
import { BlockElement } from './BlockElement'

export interface UnorderedListRendererProps extends Omit<RenderElementProps, 'element'> {
	element: UnorderedListElement
}

export const UnorderedListRenderer: FunctionComponent<UnorderedListRendererProps> = props => (
	<BlockElement {...props} domElement={'ul'} className="list-disc ml-4">{props.children}</BlockElement>
)
UnorderedListRenderer.displayName = 'UnorderedListRenderer'
