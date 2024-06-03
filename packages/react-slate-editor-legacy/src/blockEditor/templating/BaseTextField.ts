import type { ReactNode } from 'react'
import type { EditorWithBlocks } from '../editor'

export interface BaseTextField {
	placeholder: ReactNode
	render: (props: { isEmpty: boolean; children: ReactNode; editor: EditorWithBlocks }) => ReactNode
}
