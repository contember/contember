import { EntityName, FieldName } from '../bindingTypes'
import Marker from './Marker'

export type EntityFields = { [name in FieldName]: Marker }

export default class EntityMarker {
	constructor(public readonly entityName: EntityName, public fields: EntityFields, public readonly where?: any) {}
}
