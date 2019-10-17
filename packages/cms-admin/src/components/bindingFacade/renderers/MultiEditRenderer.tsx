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
		sortable,
		enableAddingNew,
		enableRemove,
		children,

		beforeContent,
		afterContent,
		emptyMessage,

		...layoutProps
	}) => (
		<MutableContentLayoutRenderer {...layoutProps}>
			<MutableEntityCollectionRenderer
				sortable={sortable}
				enableAddingNew={enableAddingNew}
				enableRemove={enableRemove}
				beforeContent={beforeContent}
				afterContent={afterContent}
				emptyMessage={emptyMessage}
			>
				{children}
			</MutableEntityCollectionRenderer>
		</MutableContentLayoutRenderer>
	),
	'',
)
