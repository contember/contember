import type { Input } from '@contember/client'
import type { Literal } from '../../dao'

export type Filter<T = Literal> = Input.Where<Input.Condition<Input.ColumnValue<T>>>

// E.g. [author.son.age < 123]
// It is *always* enclosed within square brackets.
export type SugaredFilter = Filter | string
