import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface EditorPlaceholderProps {
	children: React.ReactNode
}

// TODO add this to storybook
export const EditorPlaceholder: React.ComponentType<EditorPlaceholderProps> = props => (
	<span contentEditable={false} className={`${useClassNamePrefix()}editorPlaceholder`}>
		{props.children}
	</span>
)
EditorPlaceholder.displayName = 'EditorPlaceholder'
