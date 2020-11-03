import * as React from 'react'
import { BlockSlateEditor } from '../editor'

export interface BaseTextField {
	placeholder: React.ReactNode
	render: (props: { isEmpty: boolean; children: React.ReactNode; editor: BlockSlateEditor }) => React.ReactNode
}
