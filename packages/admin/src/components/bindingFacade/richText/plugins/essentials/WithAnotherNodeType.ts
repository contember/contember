import { ArrayContents } from './ArrayContents'
import { BaseEditor } from './BaseEditor'

export type WithAnotherNodeType<E extends BaseEditor, NodeType> = Omit<E, 'children'> & {
	children: Array<ArrayContents<E['children']> | NodeType>
}
