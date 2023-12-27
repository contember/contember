import { SchemaDefinition as def } from '@contember/schema-definition'

export const TaskStatus = def.createEnum('new', 'in_progress', 'done')

export class Task {
	title = def.stringColumn().notNull()
	status = def.enumColumn(TaskStatus).notNull()
	order = def.intColumn()
	assignee = def.manyHasOne(User, 'assignedTasks')
}

export class User {
	order = def.intColumn()
	name = def.stringColumn().notNull()
	assignedTasks = def.oneHasMany(Task, 'assignee')
}
