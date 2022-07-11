import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { PersistButton } from '../../buttons'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'
import { MutableEntityListRenderer, MutableEntityListRendererProps } from '../listRenderers'

export type MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps> =
	& LayoutRendererProps
	& MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>

export const MutableEntityListPageRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		actions,
		children,
		fit,
		headingProps,
		layout,
		navigation,
		pageContentLayout,
		side,
		title,
		...entityListProps
	}: MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>) => (
		<LayoutRenderer
			actions={actions ?? <PersistButton/>}
			fit={fit}
			headingProps={headingProps}
			navigation={navigation}
			pageContentLayout={pageContentLayout ?? layout}
			side={side}
			title={title}
		>
			<MutableEntityListRenderer {...entityListProps}>{children}</MutableEntityListRenderer>
		</LayoutRenderer>
	),
	'MutableEntityListPageRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement
