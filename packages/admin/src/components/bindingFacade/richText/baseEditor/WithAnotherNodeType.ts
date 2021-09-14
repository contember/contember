import { Editor } from 'slate'

export type WithAnotherNodeType<E extends Editor, NodeType> = Omit<E, 'children'> & {
	children: Array<E['children'][number] | NodeType>
}
