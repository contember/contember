import { Button, AnchorBasedButtonProps, PageLinkById } from '@contember/admin'
import * as React from 'react'

export type EditButtonProps = Omit<AnchorBasedButtonProps, 'Component'> & {
	pageName: string
}

export const EditButton: React.ComponentType<EditButtonProps> = ({ pageName, children, ...outerButtonProps }) => (
	<PageLinkById
		change={id => ({ name: pageName, params: { id } })}
		Component={({ isActive, ...buttonProps }) => (
			<Button {...buttonProps} {...outerButtonProps} Component="a">
				{children || 'Edit'}
			</Button>
		)}
	/>
)
