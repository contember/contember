import * as React from 'react'
import { EntityName } from '../../binding'
import { DataRendererProps } from '../../binding/coreComponents/DataProvider'

export default interface SpecificPageProps<DRP> {
	entity: EntityName
	layout?: React.ComponentType<{ children?: React.ReactNode }>
	renderer?: React.ComponentClass<DRP & DataRendererProps>
	rendererProps?: DRP
}
