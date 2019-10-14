import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityListDataProvider } from '../../binding/coreComponents'
import { MultiEditRenderer, MultiEditRendererProps } from '../bindingFacade'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

interface MultiEditPageProps extends EntityListPageProps {
	rendererProps?: Omit<MultiEditRendererProps, 'children'>
}

const MultiEditPage: Partial<PageProvider<MultiEditPageProps>> & React.ComponentType<MultiEditPageProps> = React.memo(
	(props: MultiEditPageProps) => (
		<EntityListDataProvider
			entityName={props.entityName}
			orderBy={props.orderBy}
			offset={props.offset}
			limit={props.limit}
			filter={props.filter}
		>
			<MultiEditRenderer {...props.rendererProps}>{props.children}</MultiEditRenderer>
		</EntityListDataProvider>
	),
)

MultiEditPage.getPageName = (props: MultiEditPageProps) => props.pageName || `multiEdit_${lcfirst(props.entityName)}`

export { MultiEditPage }
