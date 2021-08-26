import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { memo, ReactElement, ReactNode } from 'react'
import { FeedbackRenderer, MultiEditRenderer, MultiEditRendererProps } from '../bindingFacade/renderers'
import type { PageProvider } from './Pages'

export interface MultiEditPageProps<ContainerExtraProps, ItemExtraProps>
	extends SugaredQualifiedEntityList,
		EntityListSubTreeAdditionalProps {
	pageName: string
	children?: ReactNode
	rendererProps?: Omit<MultiEditRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
}

const MultiEditPage = memo(
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
) => ReactElement) &
	Partial<PageProvider<MultiEditPageProps<never, never>>>

MultiEditPage.getPageName = (props: MultiEditPageProps<never, never>) => props.pageName

export { MultiEditPage }
