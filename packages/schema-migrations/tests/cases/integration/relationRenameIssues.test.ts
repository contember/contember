import { SchemaBuilder } from '@contember/schema-definition'
import { describe } from 'bun:test'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

describe('relation rename with different column name should not recreate', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('BoardTask', e =>
				e.column('title')
					.manyHasOne('assignee', r => r.target('User').inversedBy('assignedTasks')),
			)
			.entity('User', e => e.column('name'))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('BoardTask', e =>
				e.column('title')
					.manyHasOne('assignedTo', r =>
						r.target('User').inversedBy('assignedTasks').alias('assignee').joiningColumn('assignee_id'),
					),
			)
			.entity('User', e => e.column('name'))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateFieldName',
			entityName: 'BoardTask',
			fieldName: 'assignee',
			newFieldName: 'assignedTo',
		},
		{
			modification: 'createRelationAliases',
			entityName: 'BoardTask',
			fieldName: 'assignedTo',
			aliases: ['assignee'],
		},
	],
	sql: SQL``,
	noDiff: false,
}))

describe('relation rename with different joining column name causes recreation', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('BoardTask', e =>
				e.column('title')
					.manyHasOne('assignee', r => r.target('User').inversedBy('assignedTasks')),
			)
			.entity('User', e => e.column('name'))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('BoardTask', e =>
				e.column('title')
					.manyHasOne('assignedTo', r =>
						r.target('User').inversedBy('assignedTasks').alias('assignee'), // Don't specify joiningColumn - let it default
					),
			)
			.entity('User', e => e.column('name'))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'updateFieldName',
			entityName: 'BoardTask',
			fieldName: 'assignee',
			newFieldName: 'assignedTo',
			columnName: 'assigned_to_id', // Use the new default column name and rename the column
		},
		{
			modification: 'createRelationAliases',
			entityName: 'BoardTask',
			fieldName: 'assignedTo',
			aliases: ['assignee'],
		},
	],
	sql: SQL`ALTER TABLE "board_task" RENAME "assignee_id" TO "assigned_to_id";`,
	noDiff: false,
}))
