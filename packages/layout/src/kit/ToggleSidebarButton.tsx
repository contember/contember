import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Button } from '@contember/ui'
import { useClassName } from '@contember/utilities'
import { PanelLeftCloseIcon, PanelLeftOpenIcon, PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react'
import { memo } from 'react'
import { useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '../primitives'
import { getLayoutPanelId } from '../primitives/getPanelId'
import { ToggleSidebarButtonProps } from './Types'

export const ToggleSidebarButton = memo<ToggleSidebarButtonProps>(({
	className: classNameProp,
	componentClassName = 'toggle-sidebar-button',
	labelWhenOpen = 'Close sidebar',
	labelWhenClosed = 'Open sidebar',
	panelName,
	position,
}) => {
	const className = useClassName(componentClassName, classNameProp)

	const { show, hide } = useSetLayoutPanelsStateContext()
	const { panels } = useGetLayoutPanelsStateContext()
	const panelState = panels.get(panelName)

	const OpenIcon = position === 'left' ? PanelLeftOpenIcon : PanelRightOpenIcon
	const CloseIcon = position === 'left' ? PanelLeftCloseIcon : PanelRightCloseIcon

	const onClick = useReferentiallyStableCallback(() => {
		panelState?.visibility === 'visible' ? hide(panelName) : show(panelName)
	})

	const id = getLayoutPanelId(panelName)

	return panelState
		? (
			<Button
				aria-haspopup="dialog"
				aria-controls={id}
				aria-expanded={panelState?.visibility === 'visible'}
				intent="default"
				flow="squarish"
				className={className}
				onClick={onClick}
				aria-label={panelState?.visibility === 'visible' ? labelWhenOpen : labelWhenClosed}
			>
				{panelState?.visibility === 'visible'
					? <CloseIcon />
					: <OpenIcon />
				}
			</Button>
		)
		: null
})
ToggleSidebarButton.displayName = 'Layout.Kit.ToggleSidebarButton'
