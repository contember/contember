import * as React from 'react'
import { Component } from '../../../binding'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import {
	ImmutableEntityCollectionRenderer,
	ImmutableEntityCollectionRendererProps,
} from './ImmutableEntityCollectionRenderer'

export interface ListRendererProps
	extends ImmutableContentLayoutRendererProps,
		ImmutableEntityCollectionRendererProps {}

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
			<ImmutableEntityCollectionRenderer
				beforeContent={beforeContent}
				afterContent={afterContent}
				emptyMessage={emptyMessage}
				wrapperComponent={wrapperComponent}
			>
				{children}
			</ImmutableEntityCollectionRenderer>
		</ImmutableContentLayoutRenderer>
	),
	'',
)
