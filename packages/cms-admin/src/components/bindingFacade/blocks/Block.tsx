import { GraphQlBuilder } from '@contember/client'
import * as React from 'react'
import { Component, Scalar } from '../../../binding'
import { LiteralStaticOption, ScalarStaticOption } from '../fields/ChoiceField'

export interface BlockCommonProps {
	label?: React.ReactNode
	description?: React.ReactNode
	children: React.ReactNode
}

export interface StaticBlockProps extends BlockCommonProps {
	discriminateBy: LiteralStaticOption['value'] | string
}
export interface DynamicBlockProps extends BlockCommonProps {
	discriminateByScalar: ScalarStaticOption['value']
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
