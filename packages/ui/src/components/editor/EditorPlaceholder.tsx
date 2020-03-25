import * as React from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { EditorNonEditable } from './EditorNonEditable'

export interface EditorPlaceholderProps {
	children: React.ReactNode
}

// TODO add this to storybook
export const EditorPlaceholder: React.ComponentType<EditorPlaceholderProps> = props => (
	<EditorNonEditable className={`${useClassNamePrefix()}editorPlaceholder`} inline>
		{props.children}
	</EditorNonEditable>
)
EditorPlaceholder.displayName = 'EditorPlaceholder'
