import { lcfirst } from 'cms-common'
import * as React from 'react'
import { EntityListDataProvider } from '../../binding/coreComponents'
import { MutableEntityCollectionRenderer, MutableEntityCollectionRendererProps } from '../bindingFacade/renderers'
import { EntityListPageProps } from './EntityListPageProps'
import { PageProvider } from './PageProvider'

interface MultiEditPageProps extends EntityListPageProps {
	rendererProps?: Omit<MutableEntityCollectionRendererProps, 'children'>
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
			<MutableEntityCollectionRenderer {...props.rendererProps}>{props.children}</MutableEntityCollectionRenderer>
		</EntityListDataProvider>
	),
)

MultiEditPage.getPageName = (props: MultiEditPageProps) => props.pageName || `multiEdit_${lcfirst(props.entityName)}`

export { MultiEditPage }
