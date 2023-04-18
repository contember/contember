import { Button } from '@contember/admin'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { MenuIcon, XIcon } from 'lucide-react'
import { memo } from 'react'
import { NestedClassName, classNameForFactory } from '../class-name'
import { useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '../ui-layout'

interface ToggleMenuButtonProps {
	className?: NestedClassName;
	componentClassName?: string;
	panel: string;
}

export const ToggleMenuButton = memo<ToggleMenuButtonProps>(({
	className,
	componentClassName = 'toggle-menu-button',
	panel,
}) => {
	const { show, hide } = useSetLayoutPanelsStateContext()
	const { panels } = useGetLayoutPanelsStateContext()
	const panelState = panels.get(panel)

	return (
		<Button
			distinction="seamless"
			className={classNameForFactory(componentClassName, [className, 'layout-slot', 'synthetic-layout-slot'])()}
			flow="squarish"
			onClick={useReferentiallyStableCallback(() => {
				panelState?.visibility === 'visible' ? hide(panel) : show(panel)
			})}
		>
			{panelState?.visibility === 'visible'
				? <XIcon />
				: <MenuIcon />
			}
		</Button>
	)
})
ToggleMenuButton.displayName = 'ToggleMenuButton'
