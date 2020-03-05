import * as React from 'react'
import { Component } from '@contember/binding'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'
import { MutableEntityListRenderer, MutableEntityListRendererProps } from './MutableEntityListRenderer'

export interface MultiEditRendererProps<ContainerExtraProps, ItemExtraProps>
	extends MutableContentLayoutRendererProps,
		MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps> {}

export const MultiEditRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		children,

		side,
		title,
		navigation,
		headingProps,
		actions,
		persistButtonComponent,

		...entityListProps
	}: MultiEditRendererProps<ContainerExtraProps, ItemExtraProps>) => (
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
) as <ContainerExtraProps, ItemExtraProps>(
	props: MultiEditRendererProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement
