import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
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
	headingProps?: HeadingProps
	actions?: ReactNode // This can contain any number of buttons but only buttons
}

/**
 * @group UI
 */
export const TitleBar = memo(({ after, navigation, children, headingProps, actions, ...props }: TitleBarProps) => {
	const prefix = useClassNamePrefix()
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
			className={classNames(
				`${prefix}titleBar`,
				toThemeClass(themeContent ?? theme, themeControls ?? theme),
				toSchemeClass(scheme),
				scheme !== layoutScheme ? 'is-global-theme' : undefined,
			)}
		>
			{navigation && (
				<nav className={`${prefix}titleBar-navigation`}>
					<ButtonList>{navigation}</ButtonList>
				</nav>
			)}
			<div className={`${prefix}titleBar-in`}>
				<div className={`${prefix}titleBar-heading`}>
					<Heading {...{ depth: 2, ...headingProps }}>{children}</Heading>
				</div>
				{actions && (
					<div className={`${prefix}titleBar-actions`}>
						<ButtonList>{actions}</ButtonList>
					</div>
				)}
			</div>
			{after && <div className={`${prefix}titleBar-after`}>
				{after}
			</div>}
		</LayoutPageStickyContainer>
	)
})
TitleBar.displayName = 'TitleBar'
