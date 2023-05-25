import { useClassName, useClassNameFactory } from '@contember/utilities'
import { MouseEventHandler, ReactNode, forwardRef, memo } from 'react'
import { toViewClass } from '../../utils'
import { Icon, IconSourceSpecification } from '../Icon'

export type ToolbarButtonLayout = 'grid' | 'list'

export interface ToolbarButton extends IconSourceSpecification {
	showLabel?: boolean
	label: ReactNode
	title?: string
	layout?: ToolbarButtonLayout
	isActive?: boolean
	onClick?: MouseEventHandler
	onMouseDown?: MouseEventHandler
}

export const EditorToolbarButton = memo(forwardRef<any, ToolbarButton>(({
	label,
	title,
	contemberIcon,
	customIcon,
	blueprintIcon,
	showLabel,
	isActive,
	layout = 'grid',
	onClick,
	onMouseDown,
}, ref) => {
	const componentClassName = useClassNameFactory('editorToolbarButton')

	return (
		<button
			ref={ref}
			role="button"
			type="button"
			tabIndex={0}
			onMouseDown={onMouseDown}
			onClick={onClick}
			title={title || String(label)}
			className={componentClassName(null, [
				toViewClass('showLabel', showLabel),
				toViewClass('active', isActive),
				toViewClass(`layout-${layout}`, true),
			])}
		>
			<span className={componentClassName('icon')}>
				<Icon size="large" {...{ contemberIcon, customIcon, blueprintIcon }} />
			</span>
			<span className={componentClassName('label')}>{label}</span>
		</button>
	)
}))

EditorToolbarButton.displayName = 'EditorToolbarButton'
