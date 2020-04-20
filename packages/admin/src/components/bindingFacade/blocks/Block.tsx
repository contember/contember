import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { Component, FieldValue, Scalar, VariableLiteral } from '@contember/binding'

export interface BlockCommonProps {
	label?: React.ReactNode
	description?: React.ReactNode
	alternate?: React.ReactNode
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

export interface NormalizedBlockCommonProps extends BlockCommonProps {
	discriminateBy: FieldValue
}

export interface NormalizedLiteralBasedBlock extends NormalizedBlockCommonProps {
	discriminateBy: GraphQlBuilder.Literal
}
export interface NormalizedScalarBasedBlock extends NormalizedBlockCommonProps {
	discriminateBy: Scalar
}

export type NormalizedBlocks =
	| {
			discriminationKind: 'literal'
			blocks: Map<string, NormalizedLiteralBasedBlock>
	  }
	| {
			discriminationKind: 'scalar'
			blocks: Map<Scalar, NormalizedScalarBasedBlock>
	  }

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
