import type { VariableFieldValue } from '../../environment/index.js'
import { JsonValue } from './Json.js'

export type FieldValue = JsonValue

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
