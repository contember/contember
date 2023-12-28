import { useClassNameFactory } from '@contember/react-utils'
import { memo, MouseEvent as ReactMouseEvent } from 'react'
import { toEnumViewClass } from '../../utils'
// import { Icon } from '../Icon'
import { PlusCircleIcon } from 'lucide-react'
import { Label } from '../Typography/Label'

export interface EditorBlockBoundaryProps {
	blockEdge: 'before' | 'after'
	onClick: (e: ReactMouseEvent<HTMLDivElement>) => void
	newParagraphText: string
}

export const EditorBlockBoundary = memo(function EditorBlockBoundary({ blockEdge, newParagraphText, onClick }: EditorBlockBoundaryProps) {
	const componentClassName = useClassNameFactory('editorBlockBoundary')

	return (
		<div
			className={componentClassName(null, [
				toEnumViewClass(`${blockEdge}Block`),
			])}
			contentEditable={false}
			data-slate-editor={false}
			onClick={onClick}
		>
			<span className={componentClassName('inner')}>
				<PlusCircleIcon />
				<Label>{newParagraphText}</Label>
			</span>
		</div>
	)
})
