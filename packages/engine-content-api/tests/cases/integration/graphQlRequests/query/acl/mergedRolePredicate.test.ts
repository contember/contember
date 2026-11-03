import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { expect, test } from 'bun:test'
import { PermissionFactory } from '../../../../../../src/index.js'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// Two roles granting a field with equally named predicates (as generated from equal conditions), plus a `through`
// grant from a third role, make the merger mint a name that exists only in the through-inclusive set:
// `__merge____merge__p__p__q`.

const model = new SchemaBuilder()
	.entity('Project', entity => entity.oneHasMany('versions', c => c.target('Version').ownedBy('project')))
	.entity('Version', entity =>
		entity
			.column('label', column => column.type(Model.ColumnType.String))
			.column('isPublic', column => column.type(Model.ColumnType.Bool))
			.column('isHidden', column => column.type(Model.ColumnType.Bool)))
	.buildSchema()

// Each role gets its own definition object, as roles loaded from a stored schema do.
const createRoleWithLabel = (): Acl.RolePermissions => ({
	variables: {},
	stages: '*',
	entities: {
		Project: { predicates: {}, operations: { read: { id: true, versions: true } } },
		Version: {
			predicates: { isPublic: { isPublic: { eq: true } } },
			operations: { read: { id: true, project: true, label: 'isPublic' } },
		},
	},
})

const schema: Schema = {
	...emptySchema,
	model,
	acl: {
		roles: {
			editor: createRoleWithLabel(),
			viewer: createRoleWithLabel(),
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
	const mergedName = '__merge____merge__isPublic__isPublic__notHidden'
	expect(all.Version.operations.read?.label).toBe(mergedName)
	expect(root.Version.operations.read?.label).toBe('__merge__isPublic__isPublic')
	expect(root.Version.predicates[mergedName]).toBeUndefined()

	await execute({
		schema: model,
		permissions: root,
		nestedPermissions: all,
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
					       ("root_"."is_public" = ? or "root_"."is_hidden" = ?) as "root_$predicate___merge____merge__isPublic__isPublic__notHidd_1",
					       "root_"."label" as "root_label"
					from "public"."version" as "root_" where "root_"."project_id" in (?)`,
				parameters: [true, false, testUuid(1)],
				response: {
					rows: [
						{
							__grouping_key: testUuid(1),
							root_id: testUuid(2),
							'root_$predicate___merge____merge__isPublic__isPublic__notHidd_1': true,
							root_label: 'v1',
						},
						{
							__grouping_key: testUuid(1),
							root_id: testUuid(3),
							'root_$predicate___merge____merge__isPublic__isPublic__notHidd_1': false,
							root_label: 'v2',
						},
					],
				},
			},
		],
		return: {
			data: {
				listProject: [
					{
						versions: [
							{ id: testUuid(2), label: 'v1' },
							{ id: testUuid(3), label: null },
						],
					},
				],
			},
		},
	})
})
