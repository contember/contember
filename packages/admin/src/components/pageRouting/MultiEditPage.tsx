import * as React from 'react'
import { EntityListDataProvider } from '@contember/binding'
import { MultiEditRenderer, MultiEditRendererProps } from '../bindingFacade/renderers'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface MultiEditPageProps<ContainerExtraProps, ItemExtraProps> extends EntityListPageProps {
	rendererProps?: Omit<MultiEditRendererProps<ContainerExtraProps, ItemExtraProps>, 'children'>
}

const MultiEditPage = React.memo(
	<ContainerExtraProps, ItemExtraProps>({
		pageName,
		rendererProps,
		children,
		...entityListProps
	}: MultiEditPageProps<ContainerExtraProps, ItemExtraProps>) => (
		<EntityListDataProvider {...entityListProps}>
			<MultiEditRenderer {...rendererProps}>{children}</MultiEditRenderer>
		</EntityListDataProvider>
	),
) as (<ContainerExtraProps, ItemExtraProps>(
	props: MultiEditPageProps<ContainerExtraProps, ItemExtraProps>,
) => React.ReactElement) &
	Partial<PageProvider<MultiEditPageProps<never, never>>>

MultiEditPage.getPageName = (props: MultiEditPageProps<never, never>) => props.pageName

export { MultiEditPage }
