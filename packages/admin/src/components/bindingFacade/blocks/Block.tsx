import { Component } from '@contember/binding'
import { FunctionComponent, ReactNode } from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../discrimination'

export interface BlockCommonProps {
	label?: ReactNode
	description?: ReactNode
	alternate?: ReactNode
	children?: ReactNode
}

export interface LiteralBasedBlockProps extends BlockCommonProps {
	discriminateBy: SugaredDiscriminateBy
}
export interface ScalarBasedBlockProps extends BlockCommonProps {
	discriminateByScalar: SugaredDiscriminateByScalar
}

export type BlockProps = LiteralBasedBlockProps | ScalarBasedBlockProps

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
