import * as React from 'react'
import { EntityName } from '../../binding'
import { MarkerFactory } from '../../binding/queryLanguage'

export interface EntityListPageProps {
	entityName: EntityName
	orderBy?: MarkerFactory.SugaredEntityListTreeConstraints['orderBy']
	offset?: MarkerFactory.SugaredEntityListTreeConstraints['offset']
	limit?: MarkerFactory.SugaredEntityListTreeConstraints['limit']
	filter?: MarkerFactory.SugaredEntityListTreeConstraints['filter']
	pageName?: string
	children?: React.ReactNode
}
