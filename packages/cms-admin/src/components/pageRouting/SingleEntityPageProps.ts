import * as React from 'react'
import { EntityName } from '../../binding'
import { MarkerFactory } from '../../binding/queryLanguage'

export interface SingleEntityPageProps {
	entityName: EntityName
	where: MarkerFactory.SugaredSingleEntityTreeConstraints['where']
	pageName?: string
	children: React.ReactNode
}
