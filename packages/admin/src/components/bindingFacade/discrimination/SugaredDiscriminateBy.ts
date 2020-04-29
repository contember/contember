import { VariableLiteral } from '@contember/binding'
import { GraphQlBuilder } from '@contember/client'

export type SugaredDiscriminateBy = GraphQlBuilder.Literal | VariableLiteral | string
