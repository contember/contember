import * as React from 'react'
import { Component } from '../../auxiliary'
import { ChoiceField } from '../../fields/ChoiceField'

export interface BlockCommonProps {
	label?: React.ReactNode
	children: React.ReactNode
}

export interface StaticBlockProps {
	discriminationLiteral: ChoiceField.LiteralValue | string
}
export interface DynamicBlockProps {
	discriminationScalar: ChoiceField.ScalarValue
}

export type BlockProps = BlockCommonProps & (StaticBlockProps | DynamicBlockProps)

export const Block = Component<BlockProps>(props => <>{props.children}</>, 'Block')
