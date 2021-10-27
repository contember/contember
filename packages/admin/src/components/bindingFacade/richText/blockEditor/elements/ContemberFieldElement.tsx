import { Element, Node } from 'slate'
import { CustomElementPlugin } from '../../baseEditor'
import { FieldBackedElement } from '../FieldBackedElement'
import { ContemberFieldElementRenderer } from '../renderers/ContemberFieldElementRenderer'

type ContemberFieldElementType = '__contember_field__'
export const contemberFieldElementType: ContemberFieldElementType = '__contember_field__'

export interface ContemberFieldElement extends Element {
	type: ContemberFieldElementType
}

export const isContemberFieldElement = (node: Node): node is ContemberFieldElement =>
	Element.isElement(node) && node.type === contemberFieldElementType

export const createContemberFieldElementPlugin = ({ leadingFields, trailingFields }: {
	leadingFields: FieldBackedElement[]
	trailingFields: FieldBackedElement[]
}): CustomElementPlugin<ContemberFieldElement> => ({
	type: contemberFieldElementType,
	canContainAnyBlocks: false,
	render: props => <ContemberFieldElementRenderer
		{...props}
		leadingFields={leadingFields}
		trailingFields={trailingFields}
	/>,
})
