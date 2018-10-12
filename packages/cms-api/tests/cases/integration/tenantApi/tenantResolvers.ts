import CompositionRoot from '../../../../src/CompositionRoot'
import { makeExecutableSchema } from 'graphql-tools'
import typeDefs from '../../../../src/tenant-api/schema/tenant.graphql'
import { executeGraphQlTest, SqlQuery } from '../../../src/testGraphql'
import { GQL, SQL } from '../../../src/tags'
import 'mocha'
import * as bcrypt from 'bcrypt'
import { testUuid } from '../../../src/testUuid'
import * as crypto from 'crypto'
import * as sinon from 'sinon'
import { Buffer } from 'buffer'
import ApiKey from '../../../../src/tenant-api/model/type/ApiKey'

export interface Test {
	query: string
	executes: SqlQuery[]
	return: object
}

export const execute = async (test: Test) => {
	const compositionRoot = new CompositionRoot()
	const tenantContainer = compositionRoot.createTenantContainer({
		database: 'foo',
		host: 'localhost',
		port: 5432,
		password: '123',
		user: 'foo',
	})

	const schema = makeExecutableSchema({ typeDefs, resolvers: tenantContainer.get('resolvers') })
	await executeGraphQlTest(tenantContainer.get('knexConnection').knex, {
		context: null,
		executes: test.executes,
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
          signUp(email: "john@doe.com", password: "123") {
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
						sql: SQL`select
                       "id",
                       "password_hash",
                       "identity_id"
                     from "tenant"."person"
                     where "email" = $1`,
						parameters: ['john@doe.com'],
						response: [
							// {id: testUuid(1), password_hash: null, identity_id: null}
						],
					},
					{
						sql: SQL`BEGIN;`,
						response: 1,
					},
					{
						sql: SQL`insert into "tenant"."tenant"."identity" ("id", "parent_id", "roles") values ($1, $2, $3)`,
						parameters: [testUuid(1), null, '[]'],
						response: 1,
					},
					{
						sql: SQL`insert into "tenant"."tenant"."person" ("email", "id", "identity_id", "password_hash") values ($1, $2, $3, $4)`,
						parameters: ['john@doe.com', testUuid(2), testUuid(1), (val: string) => bcrypt.compareSync('123', val)],
						response: 1,
					},
					{
						sql: SQL`COMMIT;`,
						response: 1,
					},
					{
						sql: SQL`select
                       "id",
                       "email"
                     from "tenant"."person"
                     where "id" = $1`,
						parameters: [testUuid(2)],
						response: [{ id: testUuid(2), email: 'john@doe.com' }],
					},
					{
						sql: SQL`select
                       "tenant"."project"."id",
                       "tenant"."project"."name"
                     from "tenant"."project"
                       inner join "tenant"."project_member" on "tenant"."project_member"."project_id" = "tenant"."project"."id"
                     where "tenant"."project_member"."person_id" = $1`,
						parameters: [testUuid(2)],
						response: [{ id: testUuid(3), name: 'foo' }],
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
						sql: SQL`select
                       "id",
                       "password_hash",
                       "identity_id"
                     from "tenant"."person"
                     where "email" = $1`,
						parameters: ['john@doe.com'],
						response: [{ id: testUuid(1), password_hash: null, identity_id: null }],
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
					return cb(undefined, val)
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
						sql: SQL`select
                       "id",
                       "password_hash",
                       "identity_id"
                     from "tenant"."person"
                     where "email" = $1`,
						parameters: ['john@doe.com'],
						response: [{ id: testUuid(1), password_hash: await bcrypt.hash('123', salt), identity_id: testUuid(2) }],
					},
					{
						sql: SQL`insert into "tenant"."api_key" ("created_at", "enabled", "expires_at", "id", "identity_id", "token_hash", "type")
            values ($1, $2, $3, $4, $5, $6, $7)`,
						parameters: [
							new Date('2018-10-12T08:00:00.000Z'),
							true,
							new Date('2018-10-12T08:30:00.000Z'),
							testUuid(1),
							testUuid(2),
							ApiKey.computeTokenHash(buffer(20).toString('hex')),
							'session',
						],
						response: 1,
					},
					{
						sql: SQL`select
                       "id",
                       "email"
                     from "tenant"."person"
                     where "id" = $1`,
						parameters: [testUuid(1)],
						response: [{ id: testUuid(1), email: 'john@doe.com' }],
					},
					{
						sql: SQL`select
                       "tenant"."project"."id",
                       "tenant"."project"."name"
                     from "tenant"."project"
                       inner join "tenant"."project_member" on "tenant"."project_member"."project_id" = "tenant"."project"."id"
                     where "tenant"."project_member"."person_id" = $1`,
						parameters: [testUuid(1)],
						response: [{ id: testUuid(2), name: 'foo' }],
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
	})
})
