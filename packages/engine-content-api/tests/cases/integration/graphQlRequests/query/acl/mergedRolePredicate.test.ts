import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { expect, test } from 'bun:test'
import { PermissionFactory } from '../../../../../../src'
import { execute } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

// Two roles granting a field with equally named predicates, plus a `through` grant from a third role, make the
// merger mint a name that exists only in the through-inclusive set: `__merge____merge__p__p__q`.

const model = new SchemaBuilder()
	.entity('Project', entity => entity.oneHasMany('versions', c => c.target('Version').ownedBy('project')))
	.entity('Version', entity =>
		entity
			.column('label', column => column.type(Model.ColumnType.String))
			.column('isHidden', column => column.type(Model.ColumnType.Bool)))
	.buildSchema()

const hasProject: Acl.PredicateDefinition = { project: { id: { isNull: false } } }

const roleWithLabel: Acl.RolePermissions = {
	variables: {},
	stages: '*',
	entities: {
		Project: { predicates: {}, operations: { read: { id: true, versions: true } } },
		Version: {
			predicates: { hasProject },
			operations: { read: { id: true, project: true, label: 'hasProject' } },
		},
	},
}

const schema: Schema = {
	...emptySchema,
	model,
	acl: {
		roles: {
			editor: roleWithLabel,
			viewer: roleWithLabel,
			listing: {
				variables: {},
				stages: '*',
				entities: {
					Version: {
						predicates: { notHidden: { isHidden: { eq: false } } },
						operations: { read: { id: true, label: 'notHidden' }, noRoot: ['read'] },
					},
				},
			},
		},
	},
}

test('nested cell predicate minted by merging roles twice is resolved', async () => {
	const { root, all } = new PermissionFactory().createContextual(schema, ['editor', 'viewer', 'listing'])
	const mergedName = '__merge____merge__hasProject__hasProject__notHidden'
	expect(all.Version.operations.read?.label).toBe(mergedName)
	expect(root.Version.predicates[mergedName]).toBeUndefined()

	await execute({
		schema: model,
		permissions: root,
		allPermissions: all,
		query: GQL`
			query {
				listProject {
					versions {
						id
						label
					}
				}
			}`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_$key_id", "root_"."id" as "root_id" from "public"."project" as "root_"`,
				parameters: [],
				response: {
					rows: [{ root_id: testUuid(1), 'root_$key_id': testUuid(1) }],
				},
			},
			{
				sql: SQL`
					select "root_"."project_id" as "__grouping_key",
					       "root_"."id" as "root_id",
					       true as "root_$predicate___merge____merge__hasProject__hasProject__not_1",
					       "root_"."label" as "root_label"
					from "public"."version" as "root_" where "root_"."project_id" in (?)`,
				parameters: [testUuid(1)],
				response: {
					rows: [
						{
							__grouping_key: testUuid(1),
							root_id: testUuid(2),
							'root_$predicate___merge____merge__hasProject__hasProject__not_1': true,
							root_label: 'v1',
						},
					],
				},
			},
		],
		return: {
			data: {
				listProject: [{ versions: [{ id: testUuid(2), label: 'v1' }] }],
			},
		},
	})
})
