import { DataBindingProvider, EntityListSubTree, SugaredQualifiedEntityList } from '@contember/binding'
import * as React from 'react'
import { FeedbackRenderer, MultiEditRenderer, MultiEditRendererProps } from '../bindingFacade/renderers'
import { PageProvider } from './PageProvider'

export interface MultiEditPageProps<ContainerExtraProps, ItemExtraProps> extends SugaredQualifiedEntityList {
	pageName: string
	children?: React.ReactNode
	rendererProps?: Omit<MultiEditRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
}

const MultiEditPage = React.memo(
	<ContainerExtraProps, ItemExtraProps>({
		children,
		rendererProps,
		pageName,
		...entityListProps
	}: MultiEditPageProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={MultiEditRenderer} listProps={rendererProps}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: MultiEditPageProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement) &
	Partial<PageProvider<MultiEditPageProps<never, never>>>

MultiEditPage.getPageName = (props: MultiEditPageProps<never, never>) => props.pageName

export { MultiEditPage }
