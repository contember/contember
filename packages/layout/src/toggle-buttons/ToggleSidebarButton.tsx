import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Button } from '@contember/ui'
import { NestedClassName, useClassName } from '@contember/utilities'
import { PanelLeftCloseIcon, PanelLeftOpenIcon, PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react'
import { memo } from 'react'
import { useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '../layout'

export interface ToggleSidebarButtonProps {
	className?: NestedClassName;
	componentClassName?: string;
	panel: string;
	position: 'left' | 'right'
}

export const ToggleSidebarButton = memo<ToggleSidebarButtonProps>(({
	className,
	componentClassName = 'toggle-sidebar-button',
	panel,
	position,
}) => {
	const { show, hide } = useSetLayoutPanelsStateContext()
	const { panels } = useGetLayoutPanelsStateContext()
	const panelState = panels.get(panel)

	const OpenIcon = position === 'left' ? PanelLeftOpenIcon : PanelRightOpenIcon
	const CloseIcon = position === 'left' ? PanelLeftCloseIcon : PanelRightCloseIcon

	return (
		<Button
			intent="default"
			flow="squarish"
			className={useClassName(componentClassName, [className, 'layout-slot'])}
			onClick={useReferentiallyStableCallback(() => {
				panelState?.visibility === 'visible' ? hide(panel) : show(panel)
			})}
		>
			{panelState?.visibility === 'visible'
				? <CloseIcon />
				: <OpenIcon />
			}
		</Button>
	)
})
