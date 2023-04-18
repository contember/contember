import { Button } from '@contember/admin'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { SidebarCloseIcon, SidebarOpenIcon } from 'lucide-react'
import { memo } from 'react'
import { NestedClassName, classNameForFactory } from '../class-name'
import { useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '../ui-layout'

interface ToggleSidebarButtonProps {
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
			className={classNameForFactory(componentClassName, [className, 'layout-slot', 'synthetic-layout-slot'])()}
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
