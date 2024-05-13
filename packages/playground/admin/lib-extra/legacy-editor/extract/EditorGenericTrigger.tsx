import * as React from 'react'
import { ReactElement } from 'react'
import { useSlate } from 'slate-react'
import { Slot } from '@radix-ui/react-slot'
import { EditorWithBlocks } from '@contember/react-legacy-editor'
import { Editor } from 'slate'
import { dataAttribute } from '@contember/utilities'

export interface EditorGenericTriggerProps {
	isActive?: (args: { editor: Editor }) => boolean
	shouldDisplay?: (args: { editor: Editor }) => boolean
	toggle: (args: { editor: Editor }) => void
	children: ReactElement
}

export const EditorGenericTrigger = ({ toggle, isActive, shouldDisplay, ...props }: EditorGenericTriggerProps) => {

	const editor = useSlate() as EditorWithBlocks
	const onClick = () => {
		toggle({ editor })
	}
	const active = isActive?.({ editor }) ?? false
	const display = shouldDisplay?.({ editor }) ?? true
	if (!display) {
		return null
	}
	return <Slot onClick={onClick} data-active={dataAttribute(active)} {...props} />
}
