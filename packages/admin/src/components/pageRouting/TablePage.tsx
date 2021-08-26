import {
	DataBindingProvider,
	EntityListSubTree,
	EntityListSubTreeAdditionalProps,
	SugaredQualifiedEntityList,
} from '@contember/binding'
import { memo, ReactElement, ReactNode } from 'react'
import { FeedbackRenderer, TableRenderer, TableRendererProps } from '../bindingFacade'
import type { PageProvider } from './Pages'

export interface TablePageProps<ContainerExtraProps, ItemExtraProps>
	extends SugaredQualifiedEntityList,
		EntityListSubTreeAdditionalProps {
	pageName: string
	children?: ReactNode
	rendererProps?: Omit<TableRendererProps<ContainerExtraProps, ItemExtraProps>, 'accessor' | 'children'>
}

const TablePage = memo(
	<ContainerExtraProps, ItemExtraProps>({
		rendererProps,
		children,
		pageName,
		...entityListProps
	}: TablePageProps<ContainerExtraProps, ItemExtraProps>) => (
		<DataBindingProvider stateComponent={FeedbackRenderer}>
			<EntityListSubTree {...entityListProps} listComponent={TableRenderer} listProps={rendererProps}>
				{children}
			</EntityListSubTree>
		</DataBindingProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: TablePageProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement) &
	Partial<PageProvider<TablePageProps<never, never>>>

TablePage.getPageName = (props: TablePageProps<never, never>) => props.pageName

export { TablePage }
