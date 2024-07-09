import { RenderElementProps } from 'slate-react'
import { FunctionComponent } from 'react'
import { BlockElement } from './BlockElement'
import { OrderedListElement } from '@contember/react-slate-editor-base'

export interface OrderedListRendererProps extends Omit<RenderElementProps, 'element'> {
	element: OrderedListElement
}

export const OrderedListRenderer: FunctionComponent<OrderedListRendererProps> = props => (
	<BlockElement {...props} domElement={'ol'} className="list-decimal ml-4">{props.children}</BlockElement>
)
OrderedListRenderer.displayName = 'OrderedListRenderer'
