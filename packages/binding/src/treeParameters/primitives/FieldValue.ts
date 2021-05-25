import type { VariableFieldValue } from '../../dao'
import type { Scalar } from './Scalar'

export type FieldValue = Scalar

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
