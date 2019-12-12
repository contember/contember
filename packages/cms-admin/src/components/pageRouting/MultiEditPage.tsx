import * as React from 'react'
import { EntityListDataProvider } from '../../binding'
import { MultiEditRenderer, MultiEditRendererProps } from '../bindingFacade/renderers'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

export interface MultiEditPageProps extends EntityListPageProps {
	rendererProps?: Omit<MultiEditRendererProps, 'children'>
}

const MultiEditPage: Partial<PageProvider<MultiEditPageProps>> & React.ComponentType<MultiEditPageProps> = React.memo(
	({ pageName, rendererProps, children, ...entityListProps }: MultiEditPageProps) => (
		<EntityListDataProvider {...entityListProps}>
			<MultiEditRenderer {...rendererProps}>{children}</MultiEditRenderer>
		</EntityListDataProvider>
	),
)

MultiEditPage.displayName = 'MultiEditPage'
MultiEditPage.getPageName = (props: MultiEditPageProps) => props.pageName

export { MultiEditPage }
