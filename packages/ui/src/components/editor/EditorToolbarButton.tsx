import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { Icon, IconSourceSpecification } from '../Icon'
import { toViewClass } from '../../utils'

export interface ToolbarButton extends IconSourceSpecification {
	showLabel?: boolean
	label: React.ReactNode
}

export const EditorToolbarButton = React.memo(
	({ label, contemberIcon, customIcon, blueprintIcon, showLabel }: ToolbarButton) => (
		<div
			role="button"
			tabIndex={0}
			className={cn(useComponentClassName('editorToolbarButton'), toViewClass('showLabel', showLabel))}
		>
			<span className={cn(useComponentClassName('editorToolbarButton-icon'))}>
				<Icon size="large" {...{ contemberIcon, customIcon, blueprintIcon }} />
			</span>
			<span className={cn(useComponentClassName('editorToolbarButton-label'))}>{label}</span>
		</div>
	),
)

EditorToolbarButton.displayName = 'EditorToolbarButton'
