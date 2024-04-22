import { BindingError, Component } from '@contember/react-binding'
import { ReactNode } from 'react'

export interface BlockProps {
	children: ReactNode
	name: string
	label?: ReactNode
	form?: ReactNode
}

export const Block = Component<BlockProps>(props => {
	throw new BindingError('"Block" component is not supposed to be rendered.')
}, ({ label, children, form }) => {
	return <>
		{label}
		{children}
		{form}
	</>
})
