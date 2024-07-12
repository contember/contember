import { Input } from '@contember/schema'
import { GraphQlLiteral } from '../graphQlBuilder'

export type OrderDirection =
	| GraphQlLiteral<'asc'>
	| GraphQlLiteral<'desc'>
	| `${Input.OrderDirection}`

