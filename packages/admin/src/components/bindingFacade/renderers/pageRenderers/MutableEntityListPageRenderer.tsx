import { Component } from '@contember/binding'
import type { ReactElement } from 'react'
import { MutableEntityListRenderer, MutableEntityListRendererProps } from '../listRenderers'
import { PersistButton } from '../../buttons'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'

export type MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps> =
	& LayoutRendererProps
	& MutableEntityListRendererProps<ContainerExtraProps, ItemExtraProps>

export const MutableEntityListPageRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		side,
		title,
		navigation,
		headingProps,
		actions,

		...entityListProps
	}: MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>) => (
		<LayoutRenderer
			side={side}
			title={title}
			navigation={navigation}
			actions={actions ?? <PersistButton/>}
			headingProps={headingProps}
		>
			<MutableEntityListRenderer {...entityListProps}>{children}</MutableEntityListRenderer>
		</LayoutRenderer>
	),
	'MutableEntityListPageRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: MutableEntityListPageRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement
