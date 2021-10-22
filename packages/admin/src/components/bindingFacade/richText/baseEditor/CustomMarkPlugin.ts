import { FunctionComponent } from 'react'
import { RenderLeafProps } from 'slate-react'

export interface CustomMarkPlugin {
	type: string
	isHotKey: (e: KeyboardEvent) => boolean
	render: FunctionComponent<RenderLeafProps>
}
