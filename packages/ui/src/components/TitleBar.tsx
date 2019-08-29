import * as React from 'react'
import { ButtonList } from './forms'
import { Heading, HeadingProps } from './Heading'

export interface TitleBarProps {
	navigation?: React.ReactNode // This can contain any number of buttons but only buttons
	children: React.ReactNode
	headingProps?: HeadingProps
	actions?: React.ReactNode // This can contain any number of buttons but only buttons
}

export const TitleBar = React.memo(({ navigation, children, headingProps, actions }: TitleBarProps) => {
	return (
		<div className="titleBar">
			{navigation && (
				<nav className="titleBar-navigation">
					<ButtonList>{navigation}</ButtonList>
				</nav>
			)}
			<div className="titleBar-in">
				<div className="titleBar-heading">
					<Heading {...headingProps}>{children}</Heading>
				</div>
				{actions && (
					<div className="titleBar-actions">
						<ButtonList>{actions}</ButtonList>
					</div>
				)}
			</div>
		</div>
	)
})
