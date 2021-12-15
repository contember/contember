import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { ButtonList } from './Forms'
import { Heading, HeadingProps } from './Typography/Heading'

export interface TitleBarProps {
	after?: ReactNode
	navigation?: ReactNode // This can contain any number of buttons but only buttons
	children: ReactNode
	headingProps?: HeadingProps
	actions?: ReactNode // This can contain any number of buttons but only buttons
}

export const TitleBar = memo(({ after, navigation, children, headingProps, actions }: TitleBarProps) => {
	const prefix = useClassNamePrefix()
	return (
		<div className={`${prefix}titleBar`}>
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
		</div>
	)
})
TitleBar.displayName = 'TitleBar'
