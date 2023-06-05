import { Component } from '@contember/binding'
import { DataGridContainer, DataGridContainerProps } from '../../collections'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'

export type DataGridPageRendererProps =
	& LayoutRendererProps
	& DataGridContainerProps

export const DataGridPageRenderer = Component(
	({
		children,

		side,
		title,
		navigation,
		actions,
		pageContentLayout,
		afterTitle,

		...entityListProps
	}: DataGridPageRendererProps) => (
		<LayoutRenderer
			side={side}
			title={title}
			afterTitle={afterTitle}
			navigation={navigation}
			actions={actions}
			pageContentLayout={pageContentLayout}
		>
			<DataGridContainer {...entityListProps}>{children}</DataGridContainer>
		</LayoutRenderer>
	),
	'ListRenderer',
)
