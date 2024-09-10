import type { GraphQlLiteral, Input } from '@contember/client'

export type Filter<T = GraphQlLiteral> = Input.Where<Input.Condition<Input.ColumnValue<T>>>

// E.g. [author.son.age < 123]
// It is *always* enclosed within square brackets.
export type SugaredFilter = Filter | string
