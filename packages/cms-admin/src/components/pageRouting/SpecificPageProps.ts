import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName, Environment, SingleEntityDataProviderProps, VariableInput } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents'
import { Parameters } from './Pages'

export default interface SpecificPageProps<DRP> {
	entity: EntityName
	where?:
		| SingleEntityDataProviderProps<DRP>['where']
		| ((routingParameters: Parameters, environment: Environment) => SingleEntityDataProviderProps<DRP>['where'])
	pageName?: string
	layout?: React.ComponentType<{ children?: React.ReactNode }>
	renderer?: React.ComponentType<DRP & DataRendererProps>
	rendererProps?: DRP
	children: React.ReactNode
}
