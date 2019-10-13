import * as React from 'react'
import { EntityName, SugaredSingleEntityTreeConstraints } from '../../binding'

export interface SingleEntityPageProps {
	entityName: EntityName
	where: SugaredSingleEntityTreeConstraints['where']
	pageName?: string
	children: React.ReactNode
}
