import * as React from 'react'
import { Component } from '../../../binding'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import { ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from './ImmutableEntityListRenderer'

export interface ListRendererProps extends ImmutableContentLayoutRendererProps, ImmutableEntityListRendererProps {}

export const ListRenderer = Component<ListRendererProps>(
	({
		children,

		side,
		title,
		navigation,
		headingProps,
		actions,

		...entityListProps
	}) => (
		<ImmutableContentLayoutRenderer
			side={side}
			title={title}
			navigation={navigation}
			actions={actions}
			headingProps={headingProps}
		>
			<ImmutableEntityListRenderer {...entityListProps}>{children}</ImmutableEntityListRenderer>
		</ImmutableContentLayoutRenderer>
	),
	'ListRenderer',
)
