import { GraphQlBuilder } from '@contember/client'
import { Scalar } from '../accessorTree'
import { VariableLiteral, VariableScalar } from '../dao'

export type FieldValue = GraphQlBuilder.Literal | Scalar

export type VariableFieldValue = VariableScalar | VariableLiteral

export type OptionallyVariableFieldValue = FieldValue | VariableFieldValue
