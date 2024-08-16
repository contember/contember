import { c } from '@contember/schema-definition'

export const BoardTaskStatus = c.createEnum('backlog', 'todo', 'inProgress', 'done')

export class BoardTask {
	title = c.stringColumn().notNull()
	description = c.stringColumn()
	status = c.enumColumn(BoardTaskStatus)
	assignee = c.manyHasOne(BoardUser).setNullOnDelete()
	tags = c.manyHasMany(BoardTag)
	order = c.intColumn()
}

export class BoardUser {
	name = c.stringColumn().notNull()
	username = c.stringColumn().unique().notNull()
	order = c.intColumn()
}

export class BoardTag {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().unique().notNull()
	color = c.stringColumn()
}
