import { useClassNameFactory } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import { ButtonList } from '../../components/Forms'
import { LayoutPageStickyContainer } from '../Layout/LayoutPageStickyContainer'
import type { ThemeScheme } from '../Layout/Types'

/** @deprecated No alternative since 1.4.0 */
export interface TitleBarProps extends ThemeScheme {
	after?: ReactNode
	navigation?: ReactNode // This can contain any number of buttons but only buttons
	children: ReactNode
	actions?: ReactNode // This can contain any number of buttons but only buttons
}

/**
 * @group UI
 * @deprecated No alternative since 1.4.0
 */
export const TitleBar = memo(({ after, navigation, children, actions, ...props }: TitleBarProps) => {
	deprecate('1.4.0', true, 'TitleBar', null)

	const componentClassName = useClassNameFactory('titleBar')

	return (
		<LayoutPageStickyContainer top={0} className={componentClassName()}>
			{navigation && (
				<nav className={componentClassName('navigation')}>
					<ButtonList>{navigation}</ButtonList>
				</nav>
			)}
			<div className={componentClassName('in')}>
				<div className={componentClassName('heading')}>
					{children}
				</div>
				{actions && (
					<div className={componentClassName('actions')}>
						<ButtonList>{actions}</ButtonList>
					</div>
				)}
			</div>
			{after && <div className={componentClassName('after')}>
				{after}
			</div>}
		</LayoutPageStickyContainer>
	)
})
TitleBar.displayName = 'TitleBar'
