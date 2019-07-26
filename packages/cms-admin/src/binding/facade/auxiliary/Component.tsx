import * as React from 'react'
import { RenderFunction, SyntheticChildrenProvider } from '../../coreComponents'

export const Component = <P extends {}>(
	render: React.FunctionComponent<P>,
	displayName?: string,
	generateSyntheticChildren: SyntheticChildrenProvider<P>['generateSyntheticChildren'] = render
) => {
	const augmentedRender: React.NamedExoticComponent<P> & Partial<SyntheticChildrenProvider<P>> = React.memo<P>(render)

	augmentedRender.generateSyntheticChildren = generateSyntheticChildren
	augmentedRender.displayName = displayName || 'UserComponent'

	return augmentedRender as RenderFunction<P> & SyntheticChildrenProvider<P>
}
