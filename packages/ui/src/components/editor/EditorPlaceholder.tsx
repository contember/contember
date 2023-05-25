import { useClassName } from '@contember/utilities'
import type { ComponentType, ReactNode } from 'react'
import { EditorNonEditable } from './EditorNonEditable'

export interface EditorPlaceholderProps {
	children: ReactNode
}

// TODO add this to storybook
export const EditorPlaceholder: ComponentType<EditorPlaceholderProps> = props => (
	<EditorNonEditable className={useClassName('editorPlaceholder')} inline>
		{props.children}
	</EditorNonEditable>
)
EditorPlaceholder.displayName = 'EditorPlaceholder'
