import cn from 'classnames'
import { forwardRef, memo, MouseEventHandler, ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { toViewClass } from '../../utils'
import { Icon, IconSourceSpecification } from '../Icon'

export enum ToolbarButtonLayout {
	GRID = 'grid',
	LIST = 'list',
}

export interface ToolbarButton extends IconSourceSpecification {
	showLabel?: boolean
	label: ReactNode
	title?: string
	layout?: ToolbarButtonLayout
	isActive?: boolean
	onClick?: MouseEventHandler
	onMouseDown?: MouseEventHandler
}

export const EditorToolbarButton = memo(
	forwardRef<any, ToolbarButton>(
		(
			{ label, title, contemberIcon, customIcon, blueprintIcon, showLabel, isActive, layout, onClick, onMouseDown },
			ref,
		) => {
			return (
				<button
					ref={ref}
					role="button"
					type="button"
					tabIndex={0}
					onMouseDown={onMouseDown}
					onClick={onClick}
					title={title || String(label)}
					className={cn(
						useComponentClassName('editorToolbarButton'),
						toViewClass('showLabel', showLabel),
						toViewClass('active', isActive),
						toViewClass(`layout-${layout || ToolbarButtonLayout.GRID}`, true),
					)}
				>
					<span className={cn(useComponentClassName('editorToolbarButton-icon'))}>
						<Icon size="large" {...{ contemberIcon, customIcon, blueprintIcon }} />
					</span>
					<span className={cn(useComponentClassName('editorToolbarButton-label'))}>{label}</span>
				</button>
			)
		},
	),
)

EditorToolbarButton.displayName = 'EditorToolbarButton'
