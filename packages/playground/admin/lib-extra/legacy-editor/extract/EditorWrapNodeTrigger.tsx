import { Selection } from 'slate'
import { MouseEventHandler, ReactElement } from 'react'
import { useSlate } from 'slate-react'
import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { EditorTransforms, EditorWithBlocks } from '@contember/react-legacy-editor'
import { composeEventHandlers } from '@radix-ui/primitive'

export interface EditorWrapNodeTriggerProps {
	elementType: string
	selection?: Selection
	suchThat?: Record<string, unknown>
	children: ReactElement
	onClick?: MouseEventHandler<HTMLElement>
}

export const EditorWrapNodeTrigger = ({ elementType, suchThat, selection, ...props }: EditorWrapNodeTriggerProps) => {
	const editor = useSlate() as EditorWithBlocks
	const onClick = () => {
		if (selection) {
			EditorTransforms.select(editor, selection)
		}
		EditorTransforms.wrapNodes(
			editor,
			{
				type: elementType,
				children: [{ text: '' }],
				...suchThat,
			},
			{ split: true },
		)
		EditorTransforms.collapse(editor, { edge: 'end' })
	}

	return <Slot {...props} onClick={composeEventHandlers(props.onClick, onClick)} />
}
