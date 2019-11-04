import * as React from 'react'
import { Component } from '../../../binding'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import { ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from './ImmutableEntityListRenderer'

export interface ListRendererProps extends ImmutableContentLayoutRendererProps, ImmutableEntityListRendererProps {}

export const ListRenderer = Component<ListRendererProps>(
	({
		children,

		beforeContent,
		afterContent,
		emptyMessage,
		wrapperComponent,

		...layoutProps
	}) => (
		<ImmutableContentLayoutRenderer {...layoutProps}>
			<ImmutableEntityListRenderer
				beforeContent={beforeContent}
				afterContent={afterContent}
				emptyMessage={emptyMessage}
				wrapperComponent={wrapperComponent}
			>
				{children}
			</ImmutableEntityListRenderer>
		</ImmutableContentLayoutRenderer>
	),
	'ListRenderer',
)
