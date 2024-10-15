import type { Input } from '@contember/client'

export type Filter<T = never> = Input.Where<Input.Condition<Input.ColumnValue<T>>>

// E.g. [author.son.age < 123]
// It is *always* enclosed within square brackets.
export type SugaredFilter = Filter | string
