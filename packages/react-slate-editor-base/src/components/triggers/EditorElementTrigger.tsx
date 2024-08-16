import * as React from 'react'
import { ReactElement } from 'react'
import { useSlate } from 'slate-react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

export interface EditorElementTriggerProps {
	elementType: string
	suchThat?: Record<string, unknown>
	children: ReactElement
}

export const EditorElementTrigger = ({ elementType, suchThat, ...props }: EditorElementTriggerProps) => {
	const editor = useSlate()

	const isActive = editor.isElementActive(elementType, suchThat)
	const onClick = () => {
		editor.toggleElement(elementType, suchThat)
	}

	return <Slot onClick={onClick} data-active={dataAttribute(isActive)} {...props} />
}
