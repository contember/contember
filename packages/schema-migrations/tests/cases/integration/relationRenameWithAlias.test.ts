import { Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { describe } from 'bun:test'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

describe('rename relation with alias and preserve joining column', () => {
	const original = new SchemaBuilder()
		.entity('BoardTask', entity => entity
			.column('title', c => c.type(Model.ColumnType.String))
			.manyHasOne('assignee', rel => rel
				.target('User')
				.joiningColumn('assignee_id'),
			),
		)
		.entity('User', entity => entity
			.column('name', c => c.type(Model.ColumnType.String)),
		)
		.buildSchema()

	const updated = new SchemaBuilder()
		.entity('BoardTask', entity => entity
			.column('title', c => c.type(Model.ColumnType.String))
			.manyHasOne('assignedTo', rel => rel
				.target('User')
				.joiningColumn('assignee_id') // Keep same column name
				.alias('assignee'), // Add alias to old name
			),
		)
		.entity('User', entity => entity
			.column('name', c => c.type(Model.ColumnType.String)),
		)
		.buildSchema()

	return testMigrations({
		original: { model: original },
		updated: { model: updated },
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'BoardTask',
				fieldName: 'assignee',
				newFieldName: 'assignedTo',
				// No columnName since we're keeping the same column name
			},
			{
				modification: 'createRelationAliases',
				entityName: 'BoardTask',
				fieldName: 'assignedTo',
				aliases: ['assignee'],
			},
		],
		sql: SQL``, // No SQL should be generated since column name stays the same
		noDiff: false,
	})
})
