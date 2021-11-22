import { Component } from '@contember/binding'
import type { FunctionComponent, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../discrimination'

export interface BlockProps {
	discriminateBy: SugaredDiscriminateBy
	boxLabel?: ReactNode
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
