import type { VariableFieldValue } from '../../dao'
import { JsonValue } from './Json'

export type FieldValue = JsonValue

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
