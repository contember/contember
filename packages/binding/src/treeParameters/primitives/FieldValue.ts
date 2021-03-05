import { VariableFieldValue } from '../../dao'
import { Scalar } from './Scalar'

export type FieldValue = Scalar

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
