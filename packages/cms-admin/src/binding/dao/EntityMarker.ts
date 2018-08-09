import { EntityName, FieldName } from '../bindingTypes'
import { FieldContextValue } from '../coreComponents/FieldContext'

export type EntityFields = {
	[name in FieldName]?: FieldContextValue
}

export default class EntityMarker {

	constructor(public readonly entityName: EntityName, public fields: EntityFields, public readonly where?: any) {

	}

}
