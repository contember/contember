import { makeExecutableSchema } from 'graphql-tools'
import typeDefs from '../../../../src/tenant-api/schema/tenant.graphql'
import { executeGraphQlTest } from '../../../src/testGraphql'
import { GQL, SQL } from '../../../src/tags'
import 'mocha'
import bcrypt from 'bcrypt'
import { testUuid } from '../../../src/testUuid'
import crypto from 'crypto'
import sinon from 'sinon'
import { Buffer } from 'buffer'
import ApiKey from '../../../../src/tenant-api/model/type/ApiKey'
import ResolverContext from '../../../../src/tenant-api/resolvers/ResolverContext'
import Identity from '../../../../src/common/auth/Identity'
import TenantContainer from '../../../../src/tenant-api/TenantContainer'
import { createConnectionMock, SqlQuery } from '../../../src/ConnectionMock'

export interface Test {
	query: string
	executes: SqlQuery[]
	return: object
}

export const execute = async (test: Test) => {
	const tenantContainer = new TenantContainer.Factory()
		.createBuilder({
			database: 'foo',
			host: 'localhost',
			port: 5432,
			password: '123',
			user: 'foo',
		})
		.replaceService('connection', () => createConnectionMock(test.executes))
		.build()

	const context: ResolverContext = new ResolverContext(
		testUuid(998),
		new Identity.StaticIdentity(testUuid(999), [], {}),
		{
			isAllowed: () => Promise.resolve(true),
		}
	)

	const schema = makeExecutableSchema({ typeDefs, resolvers: tenantContainer.resolvers as any })
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
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "email" = ?`,
						parameters: ['john@doe.com'],
						response: { rows: [] },
					},
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."identity" ("id", "parent_id", "roles") values (?, ?, ?)`,
						parameters: [testUuid(1), null, '["person"]'],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."person" ("id", "email", "password_hash", "identity_id") values (?, ?, ?, ?)`,
						parameters: [testUuid(2), 'john@doe.com', (val: string) => bcrypt.compareSync('123456', val), testUuid(1)],
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
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "email" = ?`,
						parameters: ['john@doe.com'],
						response: { rows: [{ id: testUuid(1), password_hash: null, identity_id: null }] },
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
			const buffer = (length: number) => Buffer.from(Array.from({ length: length }, () => 0x1234))
			const randomBytesStub = sinon.stub(crypto, 'randomBytes').callsFake(function(length, cb) {
				const val = buffer(length)
				if (cb) {
					return cb(null, val)
				} else {
					return val
				}
			})
			const salt = '$2a$05$CCCCCCCCCCCCCCCCCCCCCh'
			await execute({
				query: GQL`mutation {
          signIn(email: "john@doe.com", password: "123") {
            ok
            result {
              token
              person {
                id
              }
            }
          }
        }`,
				executes: [
					{
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "email" = ?`,
						parameters: ['john@doe.com'],
						response: {
							rows: [{ id: testUuid(1), password_hash: await bcrypt.hash('123', salt), identity_id: testUuid(2) }],
						},
					},
					{
						sql: SQL`insert into "tenant"."api_key" ("id", "token_hash", "type", "identity_id", "disabled_at", "expires_at", "expiration", "created_at")
            values (?, ?, ?, ?, ?, ?, ?, ?)`,
						parameters: [
							testUuid(1),
							ApiKey.computeTokenHash(buffer(20).toString('hex')),
							'session',
							testUuid(2),
							null,
							new Date('2018-10-12T08:30:00.000Z'),
							null,
							new Date('2018-10-12T08:00:00.000Z'),
						],
						response: { rowCount: 1 },
					},
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
								},
								token: buffer(20).toString('hex'),
							},
						},
					},
				},
			})
			randomBytesStub.restore()
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
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "id" = ?`,
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
						parameters: [(val: string) => bcrypt.compareSync('123456', val), testUuid(1)],
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
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "identity_id" = ?`,
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
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "identity_id" = ?`,
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
						sql: SQL`select "id", "password_hash", "identity_id", "email" from "tenant"."person" where "identity_id" = ?`,
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
          projectId: "${testUuid(5)}", 
          identityId: "${testUuid(6)}", 
          roles: ["editor"], 
          variables: [{name: "language", values: ["cs"]}]
          ) {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."project_member" ("id", "project_id", "identity_id", "roles") values (?, ?, ?, ?)`,
						parameters: [testUuid(1), testUuid(5), testUuid(6), JSON.stringify(['editor'])],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`insert into  "tenant"."project_member_variable" ("id", "project_id", "identity_id", "variable", "values") 
				values  (?, ?, ?, ?, ?) on conflict  ("project_id", "identity_id", "variable") do update set  "values" =  ?`,
						parameters: [testUuid(2), testUuid(5), testUuid(6), 'language', ['cs'], ['cs']],
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
			await execute({
				query: GQL`mutation {
          updateProjectMember(projectId: "${testUuid(5)}", identityId: "${testUuid(
					6
				)}", roles: ["editor"], variables: [{name: "language", values: ["cs"]}]) {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "id" from "tenant"."project_member" where "project_id" = ? and "identity_id" = ?`,
						response: {
							rows: [{ id: testUuid(10) }],
						},
					},
					{
						sql: SQL`update "tenant"."project_member" set "roles" = ? where "project_id" = ? and "identity_id" = ?`,
						parameters: [JSON.stringify(['editor']), testUuid(5), testUuid(6)],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`insert into  "tenant"."project_member_variable" ("id", "project_id", "identity_id", "variable", "values") 
				values  (?, ?, ?, ?, ?) on conflict  ("project_id", "identity_id", "variable") do update set  "values" =  ?`,
						parameters: [testUuid(1), testUuid(5), testUuid(6), 'language', ['cs'], ['cs']],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`delete from "tenant"."project_member_variable" where "project_id" = ? and "identity_id" = ? and not("variable" in (?))`,
						parameters: [testUuid(5), testUuid(6), 'language'],
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
						updateProjectMember: {
							ok: true,
							errors: [],
						},
					},
				},
			})
		})

		it('remove project member', async () => {
			await execute({
				query: GQL`mutation {
          removeProjectMember(projectId: "${testUuid(5)}", identityId: "${testUuid(6)}") {
            ok
	          errors {
		          code
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "id" from "tenant"."project_member" where "project_id" = ? and "identity_id" = ?`,
						response: {
							rows: [{ id: testUuid(10) }],
						},
					},
					{
						sql: SQL`delete from "tenant"."project_member" where "project_id" = ? and "identity_id" = ?`,
						parameters: [testUuid(5), testUuid(6)],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`delete from "tenant"."project_member_variable" where "project_id" = ? and "identity_id" = ? and not(false)`,
						parameters: [testUuid(5), testUuid(6)],
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
			await execute({
				query: GQL`mutation {
          createApiKey(roles: ["test"], projects: [
          	{projectId: "${testUuid(6)}", roles: ["editor"], variables: [{name: "language", values: ["cs"]}]}
          ]) {
            ok
	          errors {
		          code
	          }
	          result  {
		          identity {
			            projects {
			              id
			            }
		          }
	          }
          }
        }`,
				executes: [
					{
						sql: SQL`BEGIN;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`insert into "tenant"."identity" ("id", "parent_id", "roles") values (?, ?, ?)`,
						parameters: [testUuid(1), null, JSON.stringify(['test'])],
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
							testUuid(1),
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
						sql: SQL`insert into "tenant"."project_member" ("id", "project_id", "identity_id", "roles") values (?, ?, ?, ?)`,
						parameters: [testUuid(3), testUuid(6), testUuid(1), JSON.stringify(['editor'])],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`insert into  "tenant"."project_member_variable" ("id", "project_id", "identity_id", "variable", "values") 
				values  (?, ?, ?, ?, ?) on conflict  ("project_id", "identity_id", "variable") do update set  "values" =  ?`,
						parameters: [testUuid(4), testUuid(6), testUuid(1), 'language', ['cs'], ['cs']],
						response: {
							rowCount: 1,
						},
					},
					{
						sql: SQL`COMMIT;`,
						response: { rowCount: 1 },
					},
					{
						sql: SQL`select "project"."id", "project"."name", "project"."slug" 
								from  "tenant"."project" 
								    inner join  "tenant"."project_member" as "project_member" on  "project_member"."project_id" = "project"."id"  
								where "project_member"."identity_id" = ?
`,
						parameters: [testUuid(1)],
						response: {
							rows: [{ id: testUuid(11), name: 'test', slug: 'test' }],
						},
					},
				],
				return: {
					data: {
						createApiKey: {
							ok: true,
							errors: [],
							result: {
								identity: {
									projects: [{ id: testUuid(11) }],
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
