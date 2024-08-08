import type { VariableFieldValue } from '../../environment'
import { JsonValue } from './Json'

export type FieldValue = JsonValue

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
