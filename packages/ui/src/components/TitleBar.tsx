import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../auxiliary'
import { ButtonList } from './forms'
import { Heading, HeadingProps } from './Heading'

export interface TitleBarProps {
	navigation?: ReactNode // This can contain any number of buttons but only buttons
	children: ReactNode
	headingProps?: HeadingProps
	actions?: ReactNode // This can contain any number of buttons but only buttons
}

export const TitleBar = memo(({ navigation, children, headingProps, actions }: TitleBarProps) => {
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
					<Heading {...headingProps}>{children}</Heading>
				</div>
				{actions && (
					<div className={`${prefix}titleBar-actions`}>
						<ButtonList>{actions}</ButtonList>
					</div>
				)}
			</div>
		</div>
	)
})
TitleBar.displayName = 'TitleBar'
