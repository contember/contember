import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Button } from '@contember/ui'
import { NestedClassName, useClassName } from '@contember/utilities'
import { SidebarCloseIcon, SidebarOpenIcon } from 'lucide-react'
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

	return (
		<Button
			intent="default"
			flow="squarish"
			className={useClassName(componentClassName, [className, 'layout-slot', 'synthetic-layout-slot'])}
			onClick={useReferentiallyStableCallback(() => {
				panelState?.visibility === 'visible' ? hide(panel) : show(panel)
			})}
		>
			{panelState?.visibility === 'visible'
				? { left: <SidebarCloseIcon className="left-sidebar-close-icon" />, right: <SidebarCloseIcon className="right-sidebar-close-icon" /> }[position]
				: { left: <SidebarOpenIcon className="left-sidebar-open-icon" />, right: <SidebarOpenIcon className="right-sidebar-open-icon" /> }[position]
			}
		</Button>
	)
})
