import * as React from 'react'
import { Props, RenderFunction, SyntheticChildrenProvider } from '../../coreComponents'

export const Component = <P extends {}>(
	render: (props: Props<P>) => React.ReactElement | null,
	displayName?: string,
	generateSyntheticChildren: SyntheticChildrenProvider<P>['generateSyntheticChildren'] = render
) => {
	const augmentedRender: React.NamedExoticComponent<P> & Partial<SyntheticChildrenProvider<P>> = React.memo<P>(render)

	augmentedRender.generateSyntheticChildren = generateSyntheticChildren
	augmentedRender.displayName = displayName || 'UserComponent'

	return augmentedRender as RenderFunction<P> & SyntheticChildrenProvider<P>
}
