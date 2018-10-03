import { FieldName } from '../bindingTypes'
import Marker from './Marker'

type EntityFields = { [name in FieldName]: Marker }

export default EntityFields
