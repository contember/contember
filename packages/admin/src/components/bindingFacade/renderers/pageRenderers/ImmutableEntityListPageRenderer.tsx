import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'
import { ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from '../listRenderers'

export type ImmutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps> =
	& LayoutRendererProps
	& ImmutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>

export const ImmutableEntityListPageRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		children,

		side,
		title,
		navigation,
		actions,
		pageContentLayout,

		...entityListProps
	}: ImmutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>) => (
		<LayoutRenderer
			side={side}
			title={title}
			navigation={navigation}
			actions={actions}
			pageContentLayout={pageContentLayout}
		>
			<ImmutableEntityListRenderer {...entityListProps}>{children}</ImmutableEntityListRenderer>
		</LayoutRenderer>
	),
	'ListRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: ImmutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement
