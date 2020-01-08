import * as React from 'react'
import { Component } from '@contember/binding'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'
import { MutableEntityListRenderer, MutableEntityListRendererProps } from './MutableEntityListRenderer'

export interface MultiEditRendererProps extends MutableContentLayoutRendererProps, MutableEntityListRendererProps {}

export const MultiEditRenderer = Component<MultiEditRendererProps>(
	({
		children,

		side,
		title,
		navigation,
		headingProps,
		actions,
		persistButtonComponent,

		...entityListProps
	}) => (
		<MutableContentLayoutRenderer
			side={side}
			title={title}
			navigation={navigation}
			actions={actions}
			persistButtonComponent={persistButtonComponent}
			headingProps={headingProps}
		>
			<MutableEntityListRenderer {...entityListProps}>{children}</MutableEntityListRenderer>
		</MutableContentLayoutRenderer>
	),
	'MultiEditRenderer',
)
