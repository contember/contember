import { c } from '@contember/schema-definition'

export class RepeaterRoot {
	unique = c.enumColumn(c.createEnum('unique')).unique().notNull()
	items = c.oneHasMany(RepeaterItem, 'root').orderBy('order')
}

export class RepeaterItem {
	root = c.manyHasOne(RepeaterRoot, 'items')
	title = c.stringColumn().notNull()
	relation = c.manyHasOne(RepeaterRelation)
	order = c.intColumn()
}
export class RepeaterRelation {
	name = c.stringColumn().notNull()
}
