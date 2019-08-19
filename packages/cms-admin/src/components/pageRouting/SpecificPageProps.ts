import * as React from 'react'
import { EntityName, Environment, SingleEntityDataProviderProps, VariableInput } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents'
import { Parameters } from './Pages'

export interface SpecificPageProps<DRP> {
	entity: EntityName
	where?:
		| SingleEntityDataProviderProps<DRP>['where']
		| ((routingParameters: Parameters, environment: Environment) => SingleEntityDataProviderProps<DRP>['where'])
	pageName?: string
	renderer?: React.ComponentType<DRP & DataRendererProps>
	rendererProps?: DRP
	children?: React.ReactNode
}
