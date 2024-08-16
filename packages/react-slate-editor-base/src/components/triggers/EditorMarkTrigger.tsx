import * as React from 'react'
import { ReactElement } from 'react'
import { useSlate } from 'slate-react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

export interface EditorMarkTriggerProps {
	mark: string
	children: ReactElement
}

export const EditorMarkTrigger = ({ mark, ...props }: EditorMarkTriggerProps) => {
	const editor = useSlate()

	const isActive = editor.hasMarks({ [mark]: true })
	const onClick = () => {
		editor.toggleMarks({ [mark]: true })
	}

	return <Slot onClick={onClick} data-active={dataAttribute(isActive)} {...props} />
}
