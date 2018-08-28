import { EntityName, FieldName } from '../bindingTypes'
import FieldMarker from './FieldMarker'

export type EntityFields = { [name in FieldName]?: FieldMarker | EntityMarker }

export default class EntityMarker {
	constructor(public readonly entityName: EntityName, public fields: EntityFields, public readonly where?: any) {}
}
