import { useClassNameFactory } from '@contember/utilities'
import { memo, ReactNode } from 'react'
import { toSchemeClass, toThemeClass } from '../../utils'
import { ButtonList } from '../Forms'
import { LayoutPageStickyContainer } from '../Layout/LayoutPageStickyContainer'
import { useThemeScheme, useTitleThemeScheme } from '../Layout/ThemeSchemeContext'
import type { ThemeScheme } from '../Layout/Types'
import { Heading, HeadingProps } from '../Typography/Heading'

export interface TitleBarProps extends ThemeScheme {
	after?: ReactNode
	navigation?: ReactNode // This can contain any number of buttons but only buttons
	children: ReactNode
	actions?: ReactNode // This can contain any number of buttons but only buttons
}

/**
 * @group UI
 */
export const TitleBar = memo(({ after, navigation, children, actions, ...props }: TitleBarProps) => {
	const componentClassName = useClassNameFactory('titleBar')
	const {
		scheme,
		theme,
		themeContent,
		themeControls,
	} = useTitleThemeScheme(props)

	const { scheme: layoutScheme } = useThemeScheme({})

	return (
		<LayoutPageStickyContainer
			top={0}
			className={componentClassName(null, [
				toThemeClass(themeContent ?? theme, themeControls ?? theme),
				toSchemeClass(scheme),
				scheme !== layoutScheme ? 'is-global-theme' : undefined,
			])}
		>
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
