import { composeEventHandlers } from '@radix-ui/primitive'
import { Slot } from '@radix-ui/react-slot'
import { MouseEventHandler, ReactElement } from 'react'
import { Selection } from 'slate'
import { useSlate } from 'slate-react'
import { EditorTransforms } from '../../slate-reexport'

export interface EditorWrapNodeTriggerProps {
	elementType: string
	selection?: Selection
	suchThat?: Record<string, unknown>
	children: ReactElement
	onClick?: MouseEventHandler<HTMLElement>
}

export const EditorWrapNodeTrigger = ({ elementType, suchThat, selection, ...props }: EditorWrapNodeTriggerProps) => {
	const editor = useSlate()
	const onClick = () => {
		const currentSelection = selection || editor.selection

		if (currentSelection) {
			EditorTransforms.select(editor, currentSelection)
			EditorTransforms.wrapNodes(
				editor,
				{
					type: elementType,
					children: [{ text: '' }],
					...suchThat,
				},
				{ split: true },
			)
		}
	}

	return <Slot {...props} onClick={composeEventHandlers(props.onClick, onClick)} />
}
