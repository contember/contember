import classnames from 'classnames'
import { memo, ReactNode, useCallback, useState } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'
import { Button } from '../forms/Button'
import { Icon } from '../Icon'
import { Stack } from '../Stack'

export interface LayoutChromeProps {
	children?: ReactNode
	navBarFoot?: ReactNode
	navBarHead?: ReactNode
	navigation?: ReactNode
	switchers?: ReactNode
}

export const LayoutChrome = memo(({
	children,
	navBarFoot,
	navBarHead,
	navigation,
	switchers,
}: LayoutChromeProps) => {
	const prefix = useClassNamePrefix()

	const [collapsed, setCollapsed] = useState(true)

	const toggleCollapsed = useCallback(() => {
		setCollapsed(!collapsed)
	}, [collapsed, setCollapsed])

	return <div className={classnames(
		`${prefix}layout-chrome`,
		toViewClass('collapsed', collapsed),
	)}>
		<div className={`${prefix}layout-chrome-bar`}>
			<div className={`${prefix}layout-chrome-bar-header`}>
				{navBarHead}
				<Button distinction="seamless" className={`${prefix}layout-chrome-navigation-button`} onClick={toggleCollapsed}>
					<span className={`${prefix}chrome-menu-button-label`}>Menu</span>
					<Icon blueprintIcon={collapsed ? 'menu' : 'cross'} />
				</Button>
			</div>
			{switchers && <div className={`${prefix}layout-chrome-bar-switchers`}>{switchers}</div>}
			<div className={`${prefix}layout-chrome-bar-body`}>
				<Stack depth={3} direction="vertical">
					{navigation}
				</Stack>
			</div>
			<div className={`${prefix}layout-chrome-bar-footer`}>
				{navBarFoot}
			</div>
		</div>

		<div className={`${prefix}layout-chrome-body`}>
			{children}
		</div>
	</div>
})

LayoutChrome.displayName = 'LayoutChrome'
