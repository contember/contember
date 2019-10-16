import * as React from 'react'
import { Component } from '../../../binding'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'
import { SingleEntityRenderer, SingleEntityRendererProps } from './SingleEntityRenderer'

export interface MutableSingleEntityRendererProps
	extends MutableContentLayoutRendererProps,
		SingleEntityRendererProps {}

export const MutableSingleEntityRenderer = Component<MutableSingleEntityRendererProps>(
	({ children, side, ...contentLayoutProps }) => (
		<MutableContentLayoutRenderer {...contentLayoutProps} side={<SingleEntityRenderer>{side}</SingleEntityRenderer>}>
			<SingleEntityRenderer>{children}</SingleEntityRenderer>
		</MutableContentLayoutRenderer>
	),
	'MutableSingleEntityRenderer',
)
