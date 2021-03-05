import { Component } from '@contember/binding'
import { FunctionComponent, ReactNode } from 'react'
import { SugaredDiscriminateBy } from '../discrimination'

export interface BlockProps {
	discriminateBy: SugaredDiscriminateBy
	label?: ReactNode
	description?: ReactNode
	alternate?: ReactNode
	children?: ReactNode
}

export const Block: FunctionComponent<BlockProps> = Component(
	props => <>{props.children}</>,
	props => (
		<>
			{props.alternate}
			{props.children}
		</>
	),
	'Block',
)
