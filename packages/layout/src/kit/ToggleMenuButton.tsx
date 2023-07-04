import { useReferentiallyStableCallback } from '@contember/react-utils'
import { Button } from '@contember/ui'
import { useClassName } from '@contember/utilities'
import { MenuIcon, XIcon } from 'lucide-react'
import { memo } from 'react'
import { useGetLayoutPanelsStateContext, useSetLayoutPanelsStateContext } from '../primitives'
import { getLayoutPanelId } from '../primitives/getPanelId'
import { ToggleMenuButtonProps } from './Types'

export const ToggleMenuButton = memo<ToggleMenuButtonProps>(({
	className: classNameProp,
	componentClassName = 'toggle-menu-button',
	labelWhenOpen = 'Close menu',
	labelWhenClosed = 'Open menu',
	panelName,
}) => {
	const className = useClassName(componentClassName, classNameProp)

	const { show, hide } = useSetLayoutPanelsStateContext()
	const { panels } = useGetLayoutPanelsStateContext()
	const panelState = panels.get(panelName)

	const onClick = useReferentiallyStableCallback(() => {
		panelState?.visibility === 'visible' ? hide(panelName) : show(panelName)
	})

	const id = getLayoutPanelId(panelName)

	return panelState
		? (
			<Button
				aria-controls={id}
				aria-haspopup="dialog"
				aria-expanded={panelState?.visibility === 'visible'}
				distinction="seamless"
				className={className}
				flow="squarish"
				onClick={onClick}
				aria-label={panelState?.visibility === 'visible' ? labelWhenOpen : labelWhenClosed}
			>
				{panelState?.visibility === 'visible'
					? <XIcon />
					: <MenuIcon />
				}
			</Button>
		)
		: null
})
ToggleMenuButton.displayName = 'Interface.LayoutKit.ToggleMenuButton'
