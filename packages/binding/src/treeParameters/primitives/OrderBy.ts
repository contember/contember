import { CrudQueryBuilder, Input } from '@contember/client'

export type OrderBy = Input.OrderBy<CrudQueryBuilder.OrderDirection>[]

// E.g. items.order asc, items.content.name asc
export type SugaredOrderBy = OrderBy | string
