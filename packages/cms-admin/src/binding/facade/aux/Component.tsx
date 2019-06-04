import * as React from 'react'
import { RenderFunction, SyntheticChildrenProvider } from '../../coreComponents'

export const Component = <P extends {}>(
	render: (props: P) => React.ReactElement | null,
	displayName?: string,
	generateSyntheticChildren: SyntheticChildrenProvider<P>['generateSyntheticChildren'] = render
) => {
	const augmentedRender: RenderFunction<P> & Partial<SyntheticChildrenProvider<P>> = render

	augmentedRender.generateSyntheticChildren = generateSyntheticChildren
	augmentedRender.displayName = displayName || 'UserComponent'

	return augmentedRender as RenderFunction<P> & SyntheticChildrenProvider<P>
}
