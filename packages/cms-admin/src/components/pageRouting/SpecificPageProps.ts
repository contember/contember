import * as React from 'react'
import { Input } from 'cms-common'
import { GraphQlBuilder } from 'cms-client'
import { EntityName, Environment, VariableInput } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents'
import { Parameters } from './Pages'

export default interface SpecificPageProps<DRP> {
	entity: EntityName
	where?: (routingParameters: Parameters, environment: Environment) => Input.UniqueWhere<VariableInput>
	pageName?: string
	layout?: React.ComponentType<{ children?: React.ReactNode }>
	renderer?: React.ComponentClass<DRP & DataRendererProps>
	rendererProps?: DRP
}
