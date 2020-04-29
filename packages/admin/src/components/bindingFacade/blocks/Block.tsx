import { Component } from '@contember/binding'
import * as React from 'react'
import { SugaredDiscriminateBy, SugaredDiscriminateByScalar } from '../discrimination'

export interface BlockCommonProps {
	label?: React.ReactNode
	description?: React.ReactNode
	alternate?: React.ReactNode
	children?: React.ReactNode
}

export interface LiteralBasedBlockProps extends BlockCommonProps {
	discriminateBy: SugaredDiscriminateBy
}
export interface ScalarBasedBlockProps extends BlockCommonProps {
	discriminateByScalar: SugaredDiscriminateByScalar
}

export type BlockProps = LiteralBasedBlockProps | ScalarBasedBlockProps

export const Block = Component<BlockProps>(
	props => <>{props.children}</>,
	props => (
		<>
			{props.alternate}
			{props.children}
		</>
	),
	'Block',
)
