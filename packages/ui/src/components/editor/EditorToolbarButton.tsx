import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { toViewClass } from '../../utils'
import { Icon, IconSourceSpecification } from '../Icon'

export enum ToolbarButtonLayout {
	GRID = 'grid',
	LIST = 'list',
}

export interface ToolbarButton extends IconSourceSpecification {
	showLabel?: boolean
	label: React.ReactNode
	title?: string
	layout?: ToolbarButtonLayout
	isActive?: boolean
	onClick?: React.MouseEventHandler
	onMouseDown?: React.MouseEventHandler
}

export const EditorToolbarButton = React.memo(
	React.forwardRef<any, ToolbarButton>(
		(
			{ label, title, contemberIcon, customIcon, blueprintIcon, showLabel, isActive, layout, onClick, onMouseDown },
			ref,
		) => {
			return (
				<div
					ref={ref}
					role="button"
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
				</div>
			)
		},
	),
)

EditorToolbarButton.displayName = 'EditorToolbarButton'
