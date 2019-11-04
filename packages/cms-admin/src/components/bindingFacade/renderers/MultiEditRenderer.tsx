import * as React from 'react'
import { Component } from '../../../binding'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'
import { MutableEntityListRenderer, MutableEntityListRendererProps } from './MutableEntityListRenderer'

export interface MultiEditRendererProps extends MutableContentLayoutRendererProps, MutableEntityListRendererProps {}

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
			<MutableEntityListRenderer
				afterContent={afterContent}
				beforeContent={beforeContent}
				emptyMessage={emptyMessage}
				enableAddingNew={enableAddingNew}
				enableRemove={enableRemove}
				sortable={sortable}
				wrapperComponent={wrapperComponent}
			>
				{children}
			</MutableEntityListRenderer>
		</MutableContentLayoutRenderer>
	),
	'',
)
