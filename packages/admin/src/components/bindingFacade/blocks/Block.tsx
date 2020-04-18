import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { Component, Scalar, VariableLiteral } from '@contember/binding'

export interface BlockCommonProps {
	label?: React.ReactNode
	description?: React.ReactNode
	children: React.ReactNode
}

export type SugaredDiscriminateBy = GraphQlBuilder.Literal | VariableLiteral | string

export interface LiteralBasedBlockProps extends BlockCommonProps {
	discriminateBy: SugaredDiscriminateBy
}
export interface ScalarBasedBlockProps extends BlockCommonProps {
	discriminateByScalar: Scalar
}

export type BlockProps = LiteralBasedBlockProps | ScalarBasedBlockProps

export interface NormalizedLiteralBasedBlock extends BlockCommonProps {
	discriminateBy: GraphQlBuilder.Literal
}
export interface NormalizedScalarBasedBlock extends BlockCommonProps {
	discriminateBy: Scalar
}

export type NormalizedBlock = NormalizedLiteralBasedBlock | NormalizedScalarBasedBlock

export const Block = Component<BlockProps>(props => <>{props.children}</>, 'Block')
