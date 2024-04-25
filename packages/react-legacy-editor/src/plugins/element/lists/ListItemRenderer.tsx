import { RenderElementProps } from 'slate-react'
import { FunctionComponent } from 'react'
import { ListItemElement } from './ListItemElement'
import { BlockElement } from '../../../baseEditor'

export interface ListItemRendererProps extends Omit<RenderElementProps, 'element'> {
	element: ListItemElement
}

export const ListItemRenderer: FunctionComponent<ListItemRendererProps> = props => (
	<BlockElement {...props} domElement={'li'}>{props.children}</BlockElement>
)
ListItemRenderer.displayName = 'ListItemRenderer'
