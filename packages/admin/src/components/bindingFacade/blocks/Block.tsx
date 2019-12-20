import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { Component, Scalar, VariableLiteral } from '../../../binding'

export interface BlockCommonProps {
	label?: React.ReactNode
	description?: React.ReactNode
	children: React.ReactNode
}

export interface StaticBlockProps extends BlockCommonProps {
	discriminateBy: GraphQlBuilder.Literal | VariableLiteral | string
}
export interface DynamicBlockProps extends BlockCommonProps {
	discriminateByScalar: Scalar
}

export type BlockProps = StaticBlockProps | DynamicBlockProps

export interface NormalizedStaticBlockProps extends BlockCommonProps {
	discriminateBy: GraphQlBuilder.Literal
}
export interface NormalizedDynamicBlockProps extends BlockCommonProps {
	discriminateBy: Scalar
}

export type NormalizedBlockProps = NormalizedStaticBlockProps | NormalizedDynamicBlockProps

export type NormalizedBlockList = NormalizedStaticBlockProps[] | NormalizedDynamicBlockProps[]

export const Block = Component<BlockProps>(props => <>{props.children}</>, 'Block')
