import * as React from 'react'
import { Component } from '../../../binding'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'
import {
	MutableEntityCollectionRenderer,
	MutableEntityCollectionRendererProps,
} from './MutableEntityCollectionRenderer'

export interface MultiEditRendererProps
	extends MutableContentLayoutRendererProps,
		MutableEntityCollectionRendererProps {}

export const MultiEditRenderer = Component<MultiEditRendererProps>(
	({
		afterContent,
		beforeContent,
		children,
		emptyMessage,
		enableAddingNew,
		enableRemove,
		sortable,
		wrapperComponent,

		...layoutProps
	}) => (
		<MutableContentLayoutRenderer {...layoutProps}>
			<MutableEntityCollectionRenderer
				afterContent={afterContent}
				beforeContent={beforeContent}
				emptyMessage={emptyMessage}
				enableAddingNew={enableAddingNew}
				enableRemove={enableRemove}
				sortable={sortable}
				wrapperComponent={wrapperComponent}
			>
				{children}
			</MutableEntityCollectionRenderer>
		</MutableContentLayoutRenderer>
	),
	'',
)
