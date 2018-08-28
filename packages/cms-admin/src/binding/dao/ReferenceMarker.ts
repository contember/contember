import { FieldName } from '../bindingTypes'
import EntityMarker from './EntityMarker'

export default class ReferenceMarker {
	constructor(public readonly name: FieldName, public readonly reference: EntityMarker) {}
}
