import * as React from 'react'
import { Component } from '../../../binding'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import { SingleEntityRenderer, SingleEntityRendererProps } from './SingleEntityRenderer'

export interface ImmutableSingleEntityRendererProps
	extends ImmutableContentLayoutRendererProps,
		SingleEntityRendererProps {}

export const ImmutableSingleEntityRenderer = Component<ImmutableSingleEntityRendererProps>(
	({ children, ...contentLayoutProps }) => (
		<ImmutableContentLayoutRenderer {...contentLayoutProps}>
			<SingleEntityRenderer>{children}</SingleEntityRenderer>
		</ImmutableContentLayoutRenderer>
	),
	'ImmutableSingleEntityRenderer',
)
