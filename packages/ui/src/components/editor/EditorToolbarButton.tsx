import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { Icon, IconSourceSpecification } from '../Icon'
import { toViewClass } from '../../utils'

export enum ToolbarButtonLayout {
	GRID = 'grid',
	LIST = 'list',
}

export interface ToolbarButton extends IconSourceSpecification {
	showLabel?: boolean
	label: React.ReactNode
	layout?: ToolbarButtonLayout
	onClick?: React.MouseEventHandler
}

export const EditorToolbarButton = React.memo(
	({ label, contemberIcon, customIcon, blueprintIcon, showLabel, layout, onClick }: ToolbarButton) => (
		<div
			role="button"
			tabIndex={0}
			onClick={onClick}
			className={cn(
				useComponentClassName('editorToolbarButton'),
				toViewClass('showLabel', showLabel),
				toViewClass(`layout-${layout || ToolbarButtonLayout.GRID}`, true),
			)}
		>
			<span className={cn(useComponentClassName('editorToolbarButton-icon'))}>
				<Icon size="large" {...{ contemberIcon, customIcon, blueprintIcon }} />
			</span>
			<span className={cn(useComponentClassName('editorToolbarButton-label'))}>{label}</span>
		</div>
	),
)

EditorToolbarButton.displayName = 'EditorToolbarButton'
