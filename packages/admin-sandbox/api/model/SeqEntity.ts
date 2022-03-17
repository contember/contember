import { SchemaDefinition as d } from '@contember/schema-definition'

export class SeqEntity {
	id = d.intColumn().notNull().sequence()
	value = d.stringColumn()
	sub = d.oneHasMany(SeqEntity2, 'parent')
}

export class SeqEntity2 {
	id = d.intColumn().notNull().sequence({ precedence: 'ALWAYS', start: 100 })
	value = d.stringColumn()
	parent = d.manyHasOne(SeqEntity, 'sub')
}
