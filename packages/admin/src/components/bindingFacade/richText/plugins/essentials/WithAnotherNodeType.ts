import { BaseEditor } from './BaseEditor'

export type WithAnotherNodeType<E extends BaseEditor, NodeType> = Omit<E, 'children'> & {
	children: Array<E['children'][number] | NodeType>
}
