import classNames from 'classnames'
import { memo, MouseEvent as ReactMouseEvent } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toEnumViewClass } from '../../utils'
import { Icon } from '../Icon'
import { Label } from '../Typography/Label'

export interface EditorBlockBoundaryProps {
	blockEdge: 'before' | 'after'
	onClick: (e: ReactMouseEvent<HTMLDivElement>) => void
	newParagraphText: string
}

export const EditorBlockBoundary = memo(function EditorBlockBoundary({ blockEdge, newParagraphText, onClick }: EditorBlockBoundaryProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={classNames(
				`${prefix}editorBlockBoundary`,
				toEnumViewClass(`${blockEdge}Block`),
			)}
			contentEditable={false}
			data-slate-editor={false}
			onClick={onClick}
		>
			<span className={`${prefix}editorBlockBoundary-inner`}>
				<Icon blueprintIcon="add" />
				<Label>{newParagraphText}</Label>
			</span>
		</div>
	)
})
