import type { ReactNode } from 'react'
import type { BlockSlateEditor } from '../editor'

export interface BaseTextField {
	placeholder: ReactNode
	render: (props: { isEmpty: boolean; children: ReactNode; editor: BlockSlateEditor }) => ReactNode
}
