import { RenderElementProps } from 'slate-react'
import { FunctionComponent } from 'react'
import { OrderedListElement } from './OrderedListElement'
import { BlockElement } from '../../../baseEditor'

export interface OrderedListRendererProps extends Omit<RenderElementProps, 'element'> {
	element: OrderedListElement
}

export const OrderedListRenderer: FunctionComponent<OrderedListRendererProps> = props => (
	<BlockElement {...props} domElement={'ol'}>{props.children}</BlockElement>
)
OrderedListRenderer.displayName = 'OrderedListRenderer'
