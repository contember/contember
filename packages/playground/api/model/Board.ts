import { c } from '@contember/schema-definition'

export const BoardTaskStatus = c.createEnum('backlog', 'todo', 'inProgress', 'done')

@c.Description('This entity represents a task on a kanban-style board. Tasks can be assigned to users, tagged, and have different statuses.')
export class BoardTask {
	title = c.stringColumn().notNull()
	description = c.stringColumn().deprecated('Use the content field for rich text descriptions')
	status = c.enumColumn(BoardTaskStatus)
	assignee = c.manyHasOne(BoardUser).setNullOnDelete().description('User assigned to complete this task')
	tags = c.manyHasMany(BoardTag).description('description')
	order = c.intColumn()
}

@c.Deprecated()
export class BoardUser {
	name = c.stringColumn().notNull()
	username = c.stringColumn().unique().notNull()
	order = c.intColumn()
}

@c.Deprecated('BoardTag entity is deprecated as of v1.5 and will be removed in v2.0. Use the LabelSystem module instead for better categorization.')
export class BoardTag {
	name = c.stringColumn().notNull()
	slug = c.stringColumn().unique().notNull()
	color = c.stringColumn().deprecated()
}
