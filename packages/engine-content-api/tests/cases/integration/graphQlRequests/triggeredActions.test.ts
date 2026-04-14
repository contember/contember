import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model, Result } from '@contember/schema'
import { GQL, SQL } from '../../../src/tags'
import { testUuid } from '../../../src/testUuid'
import { type ExecutionContainerHook } from '../../../../src'
import { InsertBuilder } from '@contember/database'

test('create - triggeredActions returns empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
          mutation {
              createAuthor(data: {name: "John"}) {
                  ok
                  triggeredActions {
                      id
                      trigger
                      target
                  }
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), 'John'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: true,
					triggeredActions: [],
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('update - triggeredActions returns empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            data: {name: "John"}
          ) {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          node {
            id
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(1)],
					response: { rows: [{ name_old__: 'John' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				updateAuthor: {
					ok: true,
					triggeredActions: [],
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('delete - triggeredActions returns empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(1)}"}) {
            ok
            triggeredActions {
                id
                trigger
                target
            }
            node {
              id
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."author" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				deleteAuthor: {
					ok: true,
					triggeredActions: [],
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('upsert (not exists) - triggeredActions returns empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.column('slug', c => c.type(Model.ColumnType.String).unique()),
			)
			.buildSchema(),
		query: GQL`
          mutation {
              upsertAuthor(by: {slug: "john-doe"}, update: {name: "John Doe"}, create: {slug: "john-doe", name: "John Doe"}) {
                  ok
                  triggeredActions {
                      id
                      trigger
                      target
                  }
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id"
					from "public"."author" as "root_"  where "root_"."slug" = ?`,
					parameters: ['john-doe'],
					response: { rows: [] },
				},
				{
					sql: SQL`
						with "root_" as
    					(select ? :: uuid as "id", ? :: text as "name", ? :: text as "slug")
						insert into  "public"."author" ("id", "name", "slug") select "root_"."id", "root_"."name", "root_"."slug"  from
 						"root_"  returning "id"
					`,
					parameters: [testUuid(1), 'John Doe', 'john-doe'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"  from "public"."author" as "root_"  where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ root_id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				upsertAuthor: {
					ok: true,
					triggeredActions: [],
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('upsert (exists) - triggeredActions returns empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.column('slug', c => c.type(Model.ColumnType.String).unique()),
			)
			.buildSchema(),
		query: GQL`
          mutation {
              upsertAuthor(by: {slug: "john-doe"}, update: {name: "John Doe"}, create: {slug: "john-doe", name: "John Doe"}) {
                  ok
                  triggeredActions {
                      id
                      trigger
                      target
                  }
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id"
					from "public"."author" as "root_"  where "root_"."slug" = ?`,
					parameters: ['john-doe'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id", "root_"."slug"  from "public"."author" as "root_"  where "root_"."id" = ?)
						update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John Doe', testUuid(2)],
					response: { rows: [{ name_old__: 'Foo' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"  from "public"."author" as "root_"  where "root_"."slug" = ?`,
					parameters: ['john-doe'],
					response: { rows: [{ root_id: testUuid(2) }] },
				},
			]),
		],
		return: {
			data: {
				upsertAuthor: {
					ok: true,
					triggeredActions: [],
					node: {
						id: testUuid(2),
					},
				},
			},
		},
	})
})

test('transaction - triggeredActions returns empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(1)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				transaction: {
					ok: true,
					triggeredActions: [],
					updateAuthor: {
						ok: true,
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		},
	})
})

test('failed transaction - triggeredActions returns empty', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          errorMessage
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				transaction: {
					ok: false,
					errorMessage: `Execution has failed:\nupdateAuthor: NotFoundOrDenied (for input {"id":"${testUuid(1)}"})`,
					triggeredActions: [],
					updateAuthor: {
						ok: false,
						node: null,
					},
				},
			},
		},
	})
})

const createTriggeredActionsHook = (actions: { id: string; trigger: string; target: string }[]): ExecutionContainerHook => {
	return builder => {
		return builder.setupService('mapperFactory', mapperFactory => {
			mapperFactory.hooks.push(mapper => {
				mapper.eventManager.listen('BeforeCommitEvent', async (_event, m) => {
					m.triggeredActions = actions
				})
			})
		})
	}
}

test('create - triggeredActions populated via hook', async () => {
	const triggeredActions = [
		{ id: testUuid(100), trigger: 'onCreateAuthor', target: 'notifyWebhook' },
		{ id: testUuid(101), trigger: 'onCreateAuthor', target: 'syncSearch' },
	]
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
          mutation {
              createAuthor(data: {name: "John"}) {
                  ok
                  triggeredActions {
                      id
                      trigger
                      target
                  }
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), 'John'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		executionContainerHooks: [createTriggeredActionsHook(triggeredActions)],
		return: {
			data: {
				createAuthor: {
					ok: true,
					triggeredActions,
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('transaction - triggeredActions populated via hook', async () => {
	const triggeredActions = [
		{ id: testUuid(100), trigger: 'onUpdateAuthor', target: 'auditLog' },
	]
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(1)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		executionContainerHooks: [createTriggeredActionsHook(triggeredActions)],
		return: {
			data: {
				transaction: {
					ok: true,
					triggeredActions,
					updateAuthor: {
						ok: true,
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		},
	})
})

test('transaction - triggeredActions propagated to inner mutation results', async () => {
	const triggeredActions = [
		{ id: testUuid(100), trigger: 'onUpdateAuthor', target: 'auditLog' },
		{ id: testUuid(101), trigger: 'onUpdateAuthor', target: 'syncSearch' },
	]
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            triggeredActions {
                id
                trigger
                target
            }
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(1)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		executionContainerHooks: [createTriggeredActionsHook(triggeredActions)],
		return: {
			data: {
				transaction: {
					ok: true,
					triggeredActions,
					updateAuthor: {
						ok: true,
						triggeredActions,
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		},
	})
})

test('transaction - inner mutation triggeredActions empty without actions plugin', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            triggeredActions {
                id
                trigger
                target
            }
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(1)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				transaction: {
					ok: true,
					triggeredActions: [],
					updateAuthor: {
						ok: true,
						triggeredActions: [],
						node: {
							id: testUuid(1),
						},
					},
				},
			},
		},
	})
})

test('failed transaction - triggeredActions propagated to inner mutation results as empty', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          errorMessage
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            triggeredActions {
                id
                trigger
                target
            }
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				transaction: {
					ok: false,
					errorMessage: `Execution has failed:\nupdateAuthor: NotFoundOrDenied (for input {"id":"${testUuid(1)}"})`,
					triggeredActions: [],
					updateAuthor: {
						ok: false,
						triggeredActions: [],
						node: null,
					},
				},
			},
		},
	})
})

// --- Tests with realistic trigger pipeline simulation ---
// These hooks simulate the real engine-actions pipeline: they listen to mapper events,
// persist triggered actions into the actions_event table, and populate mapper.triggeredActions.

const createPipelineTriggersHook = (config: {
	triggerName: string
	targetName: string
	entityName: string
	create?: boolean
	update?: boolean
	delete?: boolean
}): ExecutionContainerHook => {
	return builder => {
		return builder.setupService('mapperFactory', (mapperFactory, { providers, stage, project, schemaMeta, systemSchema }) => {
			mapperFactory.hooks.push(mapper => {
				const pending: { primary: any; operation: string }[] = []

				if (config.create) {
					mapper.eventManager.listen('AfterInsertEvent', async event => {
						if (event.entity.name === config.entityName) {
							pending.push({ primary: event.id, operation: 'create' })
						}
					})
				}
				if (config.update) {
					mapper.eventManager.listen('AfterUpdateEvent', async event => {
						if (event.entity.name === config.entityName && event.hasChanges) {
							pending.push({ primary: event.id, operation: 'update' })
						}
					})
				}
				if (config.delete) {
					mapper.eventManager.listen('BeforeDeleteEvent', async event => {
						if (event.entity.name === config.entityName) {
							pending.push({ primary: event.id, operation: 'delete' })
						}
					})
				}

				mapper.eventManager.listen('BeforeCommitEvent', async (_event, m) => {
					if (pending.length === 0) return

					const client = mapper.db.forSchema(systemSchema)
					const triggeredActions: Result.TriggeredAction[] = []

					await InsertBuilder.create()
						.into('actions_event')
						.values(pending.map(p => {
							const id = providers.uuid()
							triggeredActions.push({ id, trigger: config.triggerName, target: config.targetName })
							return {
								id,
								transaction_id: mapper.transactionId,
								created_at: 'now',
								visible_at: 'now',
								num_retries: 0,
								state: 'created',
								stage_id: stage.id,
								schema_id: schemaMeta.id,
								target: config.targetName,
								trigger: config.triggerName,
								priority: 0,
								payload: { operation: p.operation, entity: config.entityName, id: p.primary },
								resolved_at: null,
								last_state_change: 'now',
							}
						}))
						.execute(client)

					await client.query('SELECT pg_notify(?, ?)', ['actions_event', project.slug])

					m.triggeredActions = triggeredActions
				})
			})
		})
	}
}

const actionsEventInsertSql = SQL`insert into "system"."actions_event"
	("id", "transaction_id", "created_at", "visible_at", "num_retries", "state", "stage_id", "schema_id", "target", "trigger", "priority", "payload", "resolved_at", "last_state_change")
	values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

const pgNotifySql = SQL`SELECT pg_notify(?, ?)`

const stageId = '00000000-0000-0000-0000-000000000000'

test('create - triggeredActions with trigger pipeline', async () => {
	// UUID sequence: testUuid(0)=transactionId, testUuid(1)=entity PK, testUuid(2)=action event ID
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
          mutation {
              createAuthor(data: {name: "John"}) {
                  ok
                  triggeredActions {
                      id
                      trigger
                      target
                  }
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), 'John'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
				{
					sql: actionsEventInsertSql,
					parameters: [
						testUuid(2), testUuid(0), 'now', 'now', 0, 'created',
						stageId, 1, 'webhook', 'onCreateAuthor', 0,
						(val: any) => val?.operation === 'create' && val?.entity === 'Author' && val?.id === testUuid(1),
						null, 'now',
					],
					response: { rows: [] },
				},
				{
					sql: pgNotifySql,
					parameters: ['actions_event', 'test'],
					response: { rows: [] },
				},
			]),
		],
		executionContainerHooks: [
			createPipelineTriggersHook({ triggerName: 'onCreateAuthor', targetName: 'webhook', entityName: 'Author', create: true }),
		],
		return: {
			data: {
				createAuthor: {
					ok: true,
					triggeredActions: [
						{ id: testUuid(2), trigger: 'onCreateAuthor', target: 'webhook' },
					],
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('update - triggeredActions with trigger pipeline', async () => {
	// UUID sequence: testUuid(0)=transactionId, testUuid(1)=action event ID (no entity PK generated for update)
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(2)}"},
            data: {name: "John"}
          ) {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          node {
            id
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(2)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(2) }],
					},
					parameters: [testUuid(2)],
				},
				{
					sql: actionsEventInsertSql,
					parameters: [
						testUuid(1), testUuid(0), 'now', 'now', 0, 'created',
						stageId, 1, 'webhook', 'onUpdateAuthor', 0,
						(val: any) => val?.operation === 'update' && val?.entity === 'Author' && val?.id === testUuid(2),
						null, 'now',
					],
					response: { rows: [] },
				},
				{
					sql: pgNotifySql,
					parameters: ['actions_event', 'test'],
					response: { rows: [] },
				},
			]),
		],
		executionContainerHooks: [
			createPipelineTriggersHook({ triggerName: 'onUpdateAuthor', targetName: 'webhook', entityName: 'Author', update: true }),
		],
		return: {
			data: {
				updateAuthor: {
					ok: true,
					triggeredActions: [
						{ id: testUuid(1), trigger: 'onUpdateAuthor', target: 'webhook' },
					],
					node: {
						id: testUuid(2),
					},
				},
			},
		},
	})
})

test('delete - triggeredActions with trigger pipeline', async () => {
	// UUID sequence: testUuid(0)=transactionId, testUuid(1)=action event ID
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(2)}"}) {
            ok
            triggeredActions {
                id
                trigger
                target
            }
            node {
              id
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ root_id: testUuid(2) }],
					},
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."author" where "id" in (?)`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: actionsEventInsertSql,
					parameters: [
						testUuid(1), testUuid(0), 'now', 'now', 0, 'created',
						stageId, 1, 'webhook', 'onDeleteAuthor', 0,
						(val: any) => val?.operation === 'delete' && val?.entity === 'Author' && val?.id === testUuid(2),
						null, 'now',
					],
					response: { rows: [] },
				},
				{
					sql: pgNotifySql,
					parameters: ['actions_event', 'test'],
					response: { rows: [] },
				},
			]),
		],
		executionContainerHooks: [
			createPipelineTriggersHook({ triggerName: 'onDeleteAuthor', targetName: 'webhook', entityName: 'Author', delete: true }),
		],
		return: {
			data: {
				deleteAuthor: {
					ok: true,
					triggeredActions: [
						{ id: testUuid(1), trigger: 'onDeleteAuthor', target: 'webhook' },
					],
					node: {
						id: testUuid(2),
					},
				},
			},
		},
	})
})

test('transaction - triggeredActions with trigger pipeline propagated to inner results', async () => {
	// UUID sequence: testUuid(0)=transactionId, testUuid(1)=action event ID
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          triggeredActions {
              id
              trigger
              target
          }
          updateAuthor(
              by: {id: "${testUuid(2)}"},
              data: {name: "John"}
            ) {
            ok
            triggeredActions {
                id
                trigger
                target
            }
            node {
              id
            }
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ?)
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(2)],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(2) }],
					},
					parameters: [testUuid(2)],
				},
				{
					sql: actionsEventInsertSql,
					parameters: [
						testUuid(1), testUuid(0), 'now', 'now', 0, 'created',
						stageId, 1, 'webhook', 'onUpdateAuthor', 0,
						(val: any) => val?.operation === 'update' && val?.entity === 'Author' && val?.id === testUuid(2),
						null, 'now',
					],
					response: { rows: [] },
				},
				{
					sql: pgNotifySql,
					parameters: ['actions_event', 'test'],
					response: { rows: [] },
				},
			]),
		],
		executionContainerHooks: [
			createPipelineTriggersHook({ triggerName: 'onUpdateAuthor', targetName: 'webhook', entityName: 'Author', update: true }),
		],
		return: {
			data: {
				transaction: {
					ok: true,
					triggeredActions: [
						{ id: testUuid(1), trigger: 'onUpdateAuthor', target: 'webhook' },
					],
					updateAuthor: {
						ok: true,
						triggeredActions: [
							{ id: testUuid(1), trigger: 'onUpdateAuthor', target: 'webhook' },
						],
						node: {
							id: testUuid(2),
						},
					},
				},
			},
		},
	})
})
