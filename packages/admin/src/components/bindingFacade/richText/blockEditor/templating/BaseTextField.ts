import { ReactNode } from 'react'
import { BlockSlateEditor } from '../editor'

export interface BaseTextField {
	placeholder: ReactNode
	render: (props: { isEmpty: boolean; children: ReactNode; editor: BlockSlateEditor }) => ReactNode
}
