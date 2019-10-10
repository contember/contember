import * as React from 'react'
import { EntityName, SugaredEntityListTreeConstraints } from '../../binding'

export interface EntityListPageProps {
	entityName: EntityName
	orderBy?: SugaredEntityListTreeConstraints['orderBy']
	offset?: SugaredEntityListTreeConstraints['offset']
	limit?: SugaredEntityListTreeConstraints['limit']
	filter?: SugaredEntityListTreeConstraints['filter']
	pageName?: string
	children?: React.ReactNode
}
