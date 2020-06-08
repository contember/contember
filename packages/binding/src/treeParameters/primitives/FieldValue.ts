import { GraphQlBuilder } from '@contember/client'
import { VariableLiteral, VariableScalar } from '../../dao'
import { Scalar } from './Scalar'

export type FieldValue = GraphQlBuilder.Literal | Scalar

export type VariableFieldValue = VariableScalar | VariableLiteral

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
