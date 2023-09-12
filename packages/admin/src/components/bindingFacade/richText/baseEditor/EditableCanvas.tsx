import { useClassName } from '@contember/react-utils'
import { EventHandler, KeyboardEvent, KeyboardEventHandler, MouseEvent, ReactElement, useCallback, useRef } from 'react'
import { Path, Transforms } from 'slate'
import { Editable, useSlate } from 'slate-react'
import { EditorWithBlocks } from '../blockEditor'

type EditableProps = typeof Editable extends (p: infer P) => any ? P : never

export interface EditableCanvasProps extends EditableProps {
	leading?: ReactElement
	trailing?: ReactElement
}

export const EditableCanvas = ({ leading, trailing, className, ...editableProps }: EditableCanvasProps) => {
	const editor = useSlate() as EditorWithBlocks
	const pathRef = useRef<Path | undefined>(undefined)

	const handleSlateNodeChange: EventHandler<MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>> = useCallback(event => {
		pathRef.current = editor.selection?.anchor.path
	}, [editor])

	const handleCapturedMouseDown: EventHandler<MouseEvent<HTMLDivElement>> = useCallback(event => {
		if (event.target instanceof HTMLElement) {
			const slateNode = event.target.dataset.slateNode

			if (slateNode === 'value' && pathRef.current) {
				Transforms.deselect(editor)
				event.stopPropagation()
				event.preventDefault()
			}
		}
	}, [editor])

	const handleCapturedKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(event => {
		if (event.key === 'Escape') {
			Transforms.deselect(editor)
			event.stopPropagation()
			event.preventDefault()
		}
	}, [editor])

	return (
		<div
			className={useClassName('editable-canvas', className)}
			onKeyDownCapture={handleCapturedKeyDown}
			onKeyUp={handleSlateNodeChange}
			onMouseDownCapture={handleCapturedMouseDown}
			onMouseUp={handleSlateNodeChange}
		>
			{leading}
			<Editable {...editableProps} />
			{trailing}
		</div>
	)
}
