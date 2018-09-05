import { EntityName, FieldName } from '../bindingTypes'
import Marker from './Marker'
import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'

export type EntityFields = { [name in FieldName]: Marker }

export default class EntityMarker {
	constructor(
		public readonly entityName: EntityName,
		public fields: EntityFields,
		public readonly where?: Input.Where<GraphQlBuilder.Literal>
	) {}
}
