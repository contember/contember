import { Component } from '@contember/binding'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'
import { DataGridContainer, DataGridContainerProps } from '../../collections'

export type DataGridPageRendererProps =
	& LayoutRendererProps
	& DataGridContainerProps

export const DataGridPageRenderer = Component(({
		children,

		side,
		title,
		navigation,
		headingProps,
		actions,

		...entityListProps
	}: DataGridPageRendererProps) => (
		<LayoutRenderer
			side={side}
			title={title}
			navigation={navigation}
			actions={actions}
			headingProps={headingProps}
		>
			<DataGridContainer {...entityListProps}>{children}</DataGridContainer>
		</LayoutRenderer>
	),
	'ListRenderer',
)
