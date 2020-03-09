import 'jasmine'
import { makeExecutableSchema } from 'graphql-tools'
import {
	createResolverContext,
	Mailer,
	MailMessage,
	PermissionContext,
	ProjectSchemaResolver,
	ResolverContext,
	SentInfo,
	StaticIdentity,
	TenantContainer,
	typeDefs,
} from '../../../src'
import { executeGraphQlTest } from '../../src/testGraphql'
import { GQL, SQL } from '../../src/tags'
import { testUuid } from '../../src/testUuid'
import { Buffer } from 'buffer'
import { createConnectionMock, ExpectedQuery } from '@contember/database-tester'
import { ProjectScopeFactory } from '../../../src/model/authorization/ProjectScopeFactory'
import { emptyModelSchema } from '../../../../schema-utils/src'
import { AclSchemaEvaluatorFactory } from '../../../src/model/authorization/AclSchemaEvaluatorFactory'
import { Acl, Schema } from '@contember/schema'
import { Membership } from '../../../src/model/type/Membership'

export interface Test {
	query: string
	executes: ExpectedQuery[]
	return: object
	sentMails?: { subject: string }[]
}

export const createUuidGenerator = () => {
	let id = 1
	return () => testUuid(id++)
}

const now = new Date('2019-09-04 12:00')
const schema: Schema = {
	model: emptyModelSchema,
	validation: {},
	acl: {
		roles: {
			editor: {
				stages: '*',
				entities: {},
				variables: {
					language: {
						type: Acl.VariableType.entity,
						entityName: 'Language',
					},
				},
			},
		},
	},
}

const expectVariablePatchSql = (args: {
	membershipId: string
	variableName: string
	values: string[]
	removeValues?: string[]
	id: string
}): ExpectedQuery => ({
	sql: SQL`
		with
		"current" as
		    (select jsonb_array_elements_text(value) as "value"
    		from "tenant"."project_membership_variable"
    		where "membership_id" = ? and "variable" = ?),
		"filtered" as
		    (select * from "current" where not(${args.removeValues ? '"value" in (?)' : 'false'})),
		"new" as
		    (select coalesce(jsonb_agg(filtered.value), '[]'::jsonb) || to_jsonb(?::TEXT[]) as "value"
		    from "filtered")
		insert into "tenant"."project_membership_variable"
		    ("id", "membership_id", "variable", "value")
		    select ?, ?, ?, "new"."value"
		from "new"
		on conflict ("membership_id", "variable")
		    do update set "value" = "excluded"."value"
		returning "value"`,
	parameters: [
		args.membershipId,
		args.variableName,
		...(args.removeValues ? args.removeValues : []),
		args.values,
		args.id,
		args.membershipId,
		args.variableName,
	],
	response: {
		rows: [args.values],
	},
})

const expectFetchMembershipsSql = (args: {
	identityId: string
	projectId: string
	membershipsResponse: Membership[]
}): ExpectedQuery => ({
	sql: SQL`with
     "memberships" as (select "project_membership"."id", "project_membership"."role" from "tenant"."project_membership" where "identity_id" = ? and "project_id" = ?),
     "variables" as (select "membership_id", json_agg(json_build_object('name', variable, 'values', value)) as "variables" from "tenant"."project_membership_variable" inner join "memberships" on "project_membership_variable"."membership_id" = "memberships"."id" group by "membership_id")
	select "role", coalesce(variables, '[]'::json) as "variables" from "memberships" left join "variables" on "memberships"."id" = "variables"."membership_id"`,
	parameters: [args.identityId, args.projectId],
	response: { rows: args.membershipsResponse },
})

const projectSchemaResolver: ProjectSchemaResolver = project => Promise.resolve(schema)

export const execute = async (test: Test) => {
	const mails = (test.sentMails || []).reverse()
	const tenantContainer = new TenantContainer.Factory()
		.createBuilder(
			{
				database: 'foo',
				host: 'localhost',
				port: 5432,
				password: '123',
				user: 'foo',
			},
			{},
			{
				bcrypt: (value: string) => Promise.resolve('BCRYPTED-' + value),
				bcryptCompare: (data: string, hash: string) => Promise.resolve('BCRYPTED-' + data === hash),
				now: () => now,
				randomBytes: (length: number) => Promise.resolve(new Buffer(length)),
				uuid: createUuidGenerator(),
			},
			projectSchemaResolver,
		)
		.replaceService('connection', () =>
			createConnectionMock(test.executes, (expected, actual, message) => {
				expect(actual).toEqual(expected, message)
			}),
		)
		.replaceService(
			'mailer',
			() =>
				new (class implements Mailer {
					async send(message: MailMessage): Promise<SentInfo> {
						const mail = mails.pop()
						if (!mail) {
							throw new Error(`Unexpected mail ${message.subject}`)
						}
						expect(message.subject).toEqual(mail.subject)
						return {}
					}
				})(),
		)
		.build()

	const context: ResolverContext = createResolverContext(
		new PermissionContext(
			new StaticIdentity(testUuid(999), []),
			{
				isAllowed: () => Promise.resolve(true),
			},
			new ProjectScopeFactory(projectSchemaResolver, new AclSchemaEvaluatorFactory()),
		),
		testUuid(998),
	)

	const schema = makeExecutableSchema({ typeDefs: typeDefs, resolvers: tenantContainer.resolvers as any })
	await executeGraphQlTest({
		context: context,
		query: test.query,
		return: test.return,
		schema: schema,
	})
}

describe('tenant api', () => {
	describe('mutations', () => {
		it('signs up', async () => {
			await execute({
				query: GQL`mutation {
          signUp(email: "john@doe.com", password: "123456") {
            ok
            result {
              person {
                id
              }
            }
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."email" = ?`,
						parameters: ['john@doe.com'],
						response: { rows: [] },
					},
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") values (?, ?, ?, ?, ?)`,
						parameters: [testUuid(1), null, '["person"]', null, now],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."person" ("id", "email", "password_hash", "identity_id") values (?, ?, ?, ?)`,
						parameters: [testUuid(2), 'john@doe.com', 'BCRYPTED-123456', testUuid(1)],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`update "tenant"."api_key"
            set "disabled_at" = ?
            where "id" = ? and "type" = ?`,
						parameters: [(val: any) => val instanceof Date, testUuid(998), 'one_off'],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select
                       "project"."id",
                       "project"."name",
                       "project"."slug"
                     from "tenant"."project"
                       inner join "tenant"."project_member" as "project_member" on "project_member"."project_id" = "project"."id"
                     where "project_member"."identity_id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(3), name: 'foo', slug: 'foo' }] },
					},
				],
				return: {
					data: {
						signUp: {
							ok: true,
							result: {
								person: {
									id: testUuid(2),
								},
							},
						},
					},
				},
			})
		})

		it('invite', async () => {
			await execute({
				query: GQL`mutation {
          invite(email: "john@doe.com", projectSlug: "blog", memberships: [{role: "editor", variables: [{name: "language", values: ["${testUuid(
						555,
					)}"]}]}]) {
            ok
            result {
              person {
                id
              }
            }
          }
        }`,
				executes: [
					{
						sql: SQL`select "id", "name", "slug" from "tenant"."project" where "slug" = ?`,
						parameters: ['blog'],
						response: { rows: [{ id: testUuid(5), name: 'blog', slug: 'blog' }] },
					},
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."email" = ?`,
						parameters: ['john@doe.com'],
						response: { rows: [] },
					},
					{
						sql: SQL`insert into "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") values (?, ?, ?, ?, ?)`,
						parameters: [testUuid(1), null, '["person"]', null, now],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."person" ("id", "email", "password_hash", "identity_id") values (?, ?, ?, ?)`,
						parameters: [testUuid(2), 'john@doe.com', 'BCRYPTED-AAAAAAAAAAAA', testUuid(1)],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "id" from "tenant"."project_membership" where "project_id" = ? and "identity_id" = ?`,
						parameters: [testUuid(5), testUuid(1)],
						response: {
							rows: [],
						},
					},
					{
						sql: SQL`insert into "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
values (?, ?, ?, ?)
on conflict ("project_id", "identity_id", "role") do update set "role" = ? returning "id"`,
						parameters: [testUuid(3), testUuid(5), testUuid(1), 'editor', 'editor'],
						response: {
							rows: [{ id: testUuid(3) }],
						},
					},
					expectVariablePatchSql({
						id: testUuid(4),
						membershipId: testUuid(3),
						values: [testUuid(555)],
						variableName: 'language',
					}),
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`update "tenant"."api_key"
            set "disabled_at" = ?
            where "id" = ? and "type" = ?`,
						parameters: [(val: any) => val instanceof Date, testUuid(998), 'one_off'],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select
                       "project"."id",
                       "project"."name",
                       "project"."slug"
                     from "tenant"."project"
                       inner join "tenant"."project_member" as "project_member" on "project_member"."project_id" = "project"."id"
                     where "project_member"."identity_id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(3), name: 'foo', slug: 'foo' }] },
					},
				],
				sentMails: [
					{
						subject: 'You have been invited to blog',
					},
				],
				return: {
					data: {
						invite: {
							ok: true,
							result: {
								person: {
									id: testUuid(2),
								},
							},
						},
					},
				},
			})
		})

		it('signs up - email already registered', async () => {
			await execute({
				query: GQL`mutation {
          signUp(email: "john@doe.com", password: "123") {
            ok
            errors {
              code
            }
            result {
              person {
                id
              }
            }
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."email" = ?`,
						parameters: ['john@doe.com'],
						response: { rows: [{ id: testUuid(1), password_hash: null, identity_id: null, roles: [] }] },
					},
				],
				return: {
					data: {
						signUp: {
							ok: false,
							errors: [
								{
									code: 'EMAIL_ALREADY_EXISTS',
								},
							],
							result: null,
						},
					},
				},
			})
		})

		it('signs in', async () => {
			// const buffer = (length: number) => Buffer.from(Array.from({ length: length }, () => 0x1234))

			await execute({
				query: GQL`mutation {
          signIn(email: "john@doe.com", password: "123") {
            ok
            result {
              token
              person {
                id
	              identity {
		              projects {
			              project {
				              slug
			              }
			              memberships {
				              role
			              }
		              }
	              }
              }
            }
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."email" = ?`,
						parameters: ['john@doe.com'],
						response: {
							rows: [
								{
									id: testUuid(1),
									password_hash: 'BCRYPTED-123',
									identity_id: testUuid(2),
									roles: [],
								},
							],
						},
					},
					{
						sql: SQL`insert into "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at")
            values (?, ?, ?, ?, ?, ?, ?, ?)`,
						parameters: [
							testUuid(1),
							'9692e67b8378a6f6753f97782d458aa757e947eab2fbdf6b5c187b74561eb78f',
							'session',
							testUuid(2),
							null,
							new Date('2019-09-04 12:30'),
							null,
							new Date('2019-09-04 12:00'),
						],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "roles" from "tenant"."identity" where "id" = ?`,
						parameters: [testUuid(2)],
						response: { rows: [{ roles: [] }] },
					},
					{
						sql: SQL`select "project"."id", "project"."name", "project"."slug"
from "tenant"."project"
where "project"."id" in (select "project_id" from "tenant"."project_membership" where "identity_id" = ?)
      and "project"."id" in (select "project_id" from "tenant"."project_membership" where "identity_id" = ?)`,
						parameters: [testUuid(2), testUuid(2)],
						response: { rows: [{ id: testUuid(10), name: 'Foo', slug: 'foo' }] },
					},
					expectFetchMembershipsSql({
						identityId: testUuid(2),
						projectId: testUuid(10),
						membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
					}),
					{
						sql: SQL`select
                       "id",
                       "email",
                       "identity_id"
                     from "tenant"."person"
                     where "id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1), email: 'john@doe.com' }] },
					},
					{
						sql: SQL`select
                       "project"."id",
                       "project"."name",
                       "project"."slug"
                     from "tenant"."project"
                       inner join "tenant"."project_member" as "project_member" on "project_member"."project_id" = "project"."id"
                     where "project_member"."identity_id" = ?`,
						parameters: [testUuid(2)],
						response: { rows: [{ id: testUuid(3), name: 'foo' }] },
					},
				],
				return: {
					data: {
						signIn: {
							ok: true,
							result: {
								person: {
									id: testUuid(1),
									identity: {
										projects: [
											{
												project: {
													slug: 'foo',
												},
												memberships: [
													{
														role: 'editor',
													},
												],
											},
										],
									},
								},
								token: '0000000000000000000000000000000000000000',
							},
						},
					},
				},
			})
		})

		it('change password', async () => {
			await execute({
				query: GQL`mutation {
          changePassword(personId: "${testUuid(1)}", password: "123456") {
            ok
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."id" = ?`,
						parameters: [testUuid(1)],
						response: {
							rows: [
								{
									id: testUuid(1),
									email: 'john@doe.com',
									identity_id: testUuid(2),
								},
							],
						},
					},
					{
						sql: SQL`update "tenant"."person"
                     set "password_hash" = ?
                     where "id" = ?`,
						parameters: ['BCRYPTED-123456', testUuid(1)],
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						changePassword: {
							ok: true,
						},
					},
				},
			})
		})

		it('sign out', async () => {
			await execute({
				query: GQL`mutation {
          signOut {
            ok
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."identity_id" = ?`,
						parameters: [testUuid(999)],
						response: {
							rows: [
								{
									id: testUuid(1),
									email: 'john@doe.com',
								},
							],
						},
					},
					{
						sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "id" = ?`,
						parameters: [(val: any) => val instanceof Date, testUuid(998)],
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						signOut: {
							ok: true,
						},
					},
				},
			})
		})

		it('sign out all', async () => {
			await execute({
				query: GQL`mutation {
          signOut(all: true) {
            ok
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."identity_id" = ?`,
						parameters: [testUuid(999)],
						response: {
							rows: [
								{
									id: testUuid(1),
									email: 'john@doe.com',
									roles: [],
								},
							],
						},
					},
					{
						sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "identity_id" = ?`,
						parameters: [(val: any) => val instanceof Date, testUuid(999)],
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						signOut: {
							ok: true,
						},
					},
				},
			})
		})

		it('sign out - not a person', async () => {
			await execute({
				query: GQL`mutation {
          signOut(all: true) {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`select "person"."id", "person"."password_hash", "person"."identity_id", "person"."email", "identity"."roles"
from "tenant"."person" inner join "tenant"."identity" as "identity" on "identity"."id" = "person"."identity_id" where "person"."identity_id" = ?`,
						parameters: [testUuid(999)],
						response: {
							rows: [],
						},
					},
				],
				return: {
					data: {
						signOut: {
							ok: false,
							errors: [
								{
									code: 'NOT_A_PERSON',
								},
							],
						},
					},
				},
			})
		})

		it('add project member', async () => {
			await execute({
				query: GQL`mutation {
          addProjectMember(
          projectSlug: "blog",
          identityId: "${testUuid(6)}",
          memberships: [
          	{
          		role: "editor",
          		variables: [{name: "language", values: ["cs"]}]
          	}
          ]
          ) {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`select "id", "name", "slug" from "tenant"."project" where "slug" = ?`,
						parameters: ['blog'],
						response: { rows: [{ id: testUuid(5), name: 'Blog', slug: 'blog' }] },
					},
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "id" from "tenant"."project_membership" where "project_id" = ? and "identity_id" = ?`,
						parameters: [testUuid(5), testUuid(6)],
						response: {
							rows: [],
						},
					},
					{
						sql: SQL`insert into "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
values (?, ?, ?, ?)
on conflict ("project_id", "identity_id", "role") do update set "role" = ? returning "id"`,
						parameters: [testUuid(1), testUuid(5), testUuid(6), 'editor', 'editor'],
						response: {
							rows: [{ id: testUuid(1) }],
						},
					},
					{
						sql: SQL`insert into  "tenant"."project_membership_variable" ("id", "membership_id", "variable", "value")
				values  (?, ?, ?, ?) on conflict  ("membership_id", "variable") do update set  "value" =  ?`,
						parameters: [testUuid(2), testUuid(1), 'language', JSON.stringify(['cs']), JSON.stringify(['cs'])],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						addProjectMember: {
							ok: true,
							errors: [],
						},
					},
				},
			})
		})

		it('update project member', async () => {
			const updatedIdentityId = testUuid(6)
			await execute({
				query: GQL`mutation {
          updateProjectMember(
          	projectSlug: "blog", identityId: "${updatedIdentityId}",
          	memberships: [{role: "editor", variables: [{name: "language", values: ["cs"]}]}]
          ) {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`select "id", "name", "slug" from "tenant"."project" where "slug" = ?`,
						parameters: ['blog'],
						response: { rows: [{ id: testUuid(5), name: 'Blog', slug: 'blog' }] },
					},
					expectFetchMembershipsSql({
						identityId: updatedIdentityId,
						projectId: testUuid(5),
						membershipsResponse: [{ role: 'editor', variables: [{ name: 'language', values: ['en'] }] }],
					}),
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "id" from "tenant"."project_membership" where "project_id" = ? and "identity_id" = ?`,
						parameters: [testUuid(5), updatedIdentityId],
						response: {
							rows: [{ id: testUuid(10) }],
						},
					},
					{
						sql: SQL`insert into "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
values (?, ?, ?, ?)
on conflict ("project_id", "identity_id", "role") do update set "role" = ? returning "id"`,
						parameters: [testUuid(1), testUuid(5), testUuid(6), 'editor', 'editor'],
						response: {
							rows: [{ id: testUuid(10) }],
						},
					},
					expectVariablePatchSql({
						membershipId: testUuid(10),
						values: ['cs'],
						removeValues: ['en'],
						variableName: 'language',
						id: testUuid(2),
					}),
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						updateProjectMember: {
							ok: true,
							errors: [],
						},
					},
				},
			})
		})

		it('remove project member', async () => {
			const identityId = testUuid(6)
			const projectId = testUuid(5)
			await execute({
				query: GQL`mutation {
          removeProjectMember(projectSlug: "blog", identityId: "${identityId}") {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`select "id", "name", "slug" from "tenant"."project" where "slug" = ?`,
						parameters: ['blog'],
						response: { rows: [{ id: projectId, name: 'Blog', slug: 'blog' }] },
					},
					expectFetchMembershipsSql({
						identityId,
						projectId,
						membershipsResponse: [{ role: 'editor', variables: [] }],
					}),
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`delete from "tenant"."project_membership" where "project_id" = ? and "identity_id" = ?`,
						parameters: [projectId, identityId],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						removeProjectMember: {
							ok: true,
							errors: [],
						},
					},
				},
			})
		})

		it('create api key', async () => {
			const identityId = testUuid(1)
			await execute({
				query: GQL`mutation {
          createApiKey(projectSlug: "blog", memberships: [{role: "editor", variables: [{name: "language", values: ["cs"]}]}], description: "test") {
            ok
	          errors {
		          code
	          }
	          result  {
		          apiKey {
			          identity {
				            projects {
					            project {
				              	id
					            }
					            memberships {
				              	role
					            }
				            }
			          }
		          }
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`select "id", "name", "slug" from "tenant"."project" where "slug" = ?`,
						parameters: ['blog'],
						response: { rows: [{ id: testUuid(6), name: 'Blog', slug: 'blog' }] },
					},
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."identity" ("id", "parent_id", "roles", "description", "created_at") values (?, ?, ?, ?, ?)`,
						parameters: [identityId, null, JSON.stringify([]), 'test', now],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`insert into "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at") values (?, ?, ?, ?, ?, ?, ?, ?)`,
						parameters: [
							testUuid(2),
							() => true,
							'permanent',
							identityId,
							null,
							null,
							null,
							(val: any) => val instanceof Date,
						],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`select "id" from "tenant"."project_membership" where "project_id" = ? and "identity_id" = ?`,
						parameters: [testUuid(6), identityId],
						response: {
							rows: [],
						},
					},
					{
						sql: SQL`insert into "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
values (?, ?, ?, ?)
on conflict ("project_id", "identity_id", "role") do update set "role" = ? returning "id"`,
						parameters: [testUuid(3), testUuid(6), identityId, 'editor', 'editor'],
						response: {
							rows: [{ id: testUuid(10) }],
						},
					},
					{
						sql: SQL`insert into  "tenant"."project_membership_variable" ("id", "membership_id", "variable", "value")
				values  (?, ?, ?, ?) on conflict  ("membership_id", "variable") do update set  "value" =  ?`,
						parameters: [testUuid(4), testUuid(10), 'language', JSON.stringify(['cs']), JSON.stringify(['cs'])],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "roles" from "tenant"."identity" where "id" = ?`,
						parameters: [identityId],
						response: { rows: [{ roles: [] }] },
					},
					{
						sql: SQL`select "project"."id", "project"."name", "project"."slug" from "tenant"."project" where "project"."id" in (select "project_id" from "tenant"."project_membership" where "identity_id" = ?)`,
						parameters: [identityId],
						response: {
							rows: [{ id: testUuid(6), name: 'test', slug: 'test' }],
						},
					},
					expectFetchMembershipsSql({
						identityId: identityId,
						projectId: testUuid(6),
						membershipsResponse: [{ role: 'editor', variables: [{ name: 'language', values: ['cs'] }] }],
					}),
				],
				return: {
					data: {
						createApiKey: {
							ok: true,
							errors: [],
							result: {
								apiKey: {
									identity: {
										projects: [{ project: { id: testUuid(6) }, memberships: [{ role: 'editor' }] }],
									},
								},
							},
						},
					},
				},
			})
		})

		it('disable api key', async () => {
			await execute({
				query: GQL`mutation {
          disableApiKey(id: "${testUuid(1)}"){
            ok
          }
        }`,
				executes: [
					{
						sql: SQL`update "tenant"."api_key" set "disabled_at" = ? where "id" = ?`,
						parameters: [(val: any) => val instanceof Date, testUuid(1)],
						response: { rowCount: 1 },
					},
				],
				return: {
					data: {
						disableApiKey: {
							ok: true,
						},
					},
				},
			})
		})
	})
})
