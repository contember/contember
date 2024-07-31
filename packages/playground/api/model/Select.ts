import { c } from '@contember/schema-definition'

export const SelectUnique = c.createEnum('unique')

export class SelectRoot {
    unique = c.enumColumn(SelectUnique).notNull().unique()
    dummy = c.stringColumn()
    hasOne = c.oneHasOne(SelectValue)
    hasMany = c.manyHasMany(SelectValue)
    hasManySorted = c.oneHasMany(SelectItem, 'root').orderBy('order')
}

export class SelectItem {
    root = c.manyHasOne(SelectRoot, 'hasManySorted').notNull()
    value = c.manyHasOne(SelectValue).notNull()
    order = c.intColumn()
}

export class SelectValue {
    name = c.stringColumn().notNull()
    slug = c.stringColumn().notNull().unique()
}
