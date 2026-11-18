/**
 * Adapted from graphql-js nonnull-test.ts
 *
 * Tests non-nullable type handling during execution.
 */

import { describe, expect, it } from 'bun:test'
import { parse } from 'graphql'

import { buildSchema, execute, executeSync, type ExecutionResult, type Schema } from '../../src/index.js'
import { expectJSON } from './testUtils.js'

const syncError = new Error('sync')
const syncNonNullError = new Error('syncNonNull')
const promiseError = new Error('promise')
const promiseNonNullError = new Error('promiseNonNull')

const throwingData = {
	sync() {
		throw syncError
	},
	syncNonNull() {
		throw syncNonNullError
	},
	promise() {
		return new Promise(() => {
			throw promiseError
		})
	},
	promiseNonNull() {
		return new Promise(() => {
			throw promiseNonNullError
		})
	},
	syncNest() {
		return throwingData
	},
	syncNonNullNest() {
		return throwingData
	},
	promiseNest() {
		return new Promise((resolve) => {
			resolve(throwingData)
		})
	},
	promiseNonNullNest() {
		return new Promise((resolve) => {
			resolve(throwingData)
		})
	},
}

const nullingData = {
	sync() {
		return null
	},
	syncNonNull() {
		return null
	},
	promise() {
		return new Promise((resolve) => {
			resolve(null)
		})
	},
	promiseNonNull() {
		return new Promise((resolve) => {
			resolve(null)
		})
	},
	syncNest() {
		return nullingData
	},
	syncNonNullNest() {
		return nullingData
	},
	promiseNest() {
		return new Promise((resolve) => {
			resolve(nullingData)
		})
	},
	promiseNonNullNest() {
		return new Promise((resolve) => {
			resolve(nullingData)
		})
	},
}

const schema = buildSchema(`
  type DataType {
    sync: String
    syncNonNull: String!
    promise: String
    promiseNonNull: String!
    syncNest: DataType
    syncNonNullNest: DataType!
    promiseNest: DataType
    promiseNonNullNest: DataType!
  }

  schema {
    query: DataType
  }
`)

function executeQuery(query: string, rootValue: unknown): ExecutionResult | Promise<ExecutionResult> {
	return execute({ schema, document: parse(query), rootValue })
}

function patch(str: string): string {
	return str.replace(/\bsync\b/g, 'promise').replace(/\bsyncNonNull\b/g, 'promiseNonNull')
}

function patchData(data: ExecutionResult): ExecutionResult {
	return JSON.parse(patch(JSON.stringify(data)))
}

async function executeSyncAndAsync(query: string, rootValue: unknown) {
	const syncResult = executeSync({ schema, document: parse(query), rootValue })
	const asyncResult = await execute({
		schema,
		document: parse(patch(query)),
		rootValue,
	})

	expectJSON(asyncResult).toDeepEqual(patchData(syncResult))
	return syncResult
}

describe('Execute: handles non-nullable types', () => {
	describe('nulls a nullable field', () => {
		const query = `
      {
        sync
      }
    `

		it('that returns null', async () => {
			const result = await executeSyncAndAsync(query, nullingData)
			expect(result).toEqual({
				data: { sync: null },
			})
		})

		it('that throws', async () => {
			const result = await executeSyncAndAsync(query, throwingData)
			expect(result.data).toEqual({ sync: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toBe(syncError.message)
			expect(result.errors?.[0].path).toEqual(['sync'])
		})
	})

	describe('nulls a returned object that contains a non-nullable field', () => {
		const query = `
      {
        syncNest {
          syncNonNull,
        }
      }
    `

		it('that returns null', async () => {
			const result = executeSync({ schema, document: parse(query), rootValue: nullingData })
			expect(result.data).toEqual({ syncNest: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toContain('Cannot return null')
			expect(result.errors?.[0].path).toEqual(['syncNest', 'syncNonNull'])
		})

		it('that throws', async () => {
			const result = executeSync({ schema, document: parse(query), rootValue: throwingData })
			expect(result.data).toEqual({ syncNest: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toBe(syncNonNullError.message)
			expect(result.errors?.[0].path).toEqual(['syncNest', 'syncNonNull'])
		})
	})

	describe('nulls a complex tree of nullable fields, each', () => {
		const query = `
      {
        syncNest {
          sync
          promise
          syncNest { sync promise }
          promiseNest { sync promise }
        }
        promiseNest {
          sync
          promise
          syncNest { sync promise }
          promiseNest { sync promise }
        }
      }
    `
		const expectedData = {
			syncNest: {
				sync: null,
				promise: null,
				syncNest: { sync: null, promise: null },
				promiseNest: { sync: null, promise: null },
			},
			promiseNest: {
				sync: null,
				promise: null,
				syncNest: { sync: null, promise: null },
				promiseNest: { sync: null, promise: null },
			},
		}

		it('that returns null', async () => {
			const result = await executeQuery(query, nullingData)
			expect(result).toEqual({ data: expectedData })
		})

		it('that throws', async () => {
			const result = await executeQuery(query, throwingData)
			expect(result.data).toEqual(expectedData)
			expect(result.errors).toHaveLength(12)
		})
	})

	describe('nulls the first nullable object after a field in a long chain of non-null fields', () => {
		const query = `
      {
        syncNest {
          syncNonNullNest {
            promiseNonNullNest {
              syncNonNullNest {
                promiseNonNullNest {
                  syncNonNull
                }
              }
            }
          }
        }
        promiseNest {
          syncNonNullNest {
            promiseNonNullNest {
              syncNonNullNest {
                promiseNonNullNest {
                  syncNonNull
                }
              }
            }
          }
        }
        anotherNest: syncNest {
          syncNonNullNest {
            promiseNonNullNest {
              syncNonNullNest {
                promiseNonNullNest {
                  promiseNonNull
                }
              }
            }
          }
        }
        anotherPromiseNest: promiseNest {
          syncNonNullNest {
            promiseNonNullNest {
              syncNonNullNest {
                promiseNonNullNest {
                  promiseNonNull
                }
              }
            }
          }
        }
      }
    `

		it('that returns null', async () => {
			const result = await executeQuery(query, nullingData)
			expect(result.data).toEqual({
				syncNest: null,
				promiseNest: null,
				anotherNest: null,
				anotherPromiseNest: null,
			})
			expect(result.errors).toHaveLength(4)
		})

		it('that throws', async () => {
			const result = await executeQuery(query, throwingData)
			expect(result.data).toEqual({
				syncNest: null,
				promiseNest: null,
				anotherNest: null,
				anotherPromiseNest: null,
			})
			expect(result.errors).toHaveLength(4)
		})
	})

	describe('nulls the top level if non-nullable field', () => {
		const query = `
      {
        syncNonNull
      }
    `

		it('that returns null', async () => {
			const result = executeSync({ schema, document: parse(query), rootValue: nullingData })
			expect(result.data).toBeNull()
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toContain('Cannot return null')
		})

		it('that throws', async () => {
			const result = executeSync({ schema, document: parse(query), rootValue: throwingData })
			expect(result.data).toBeNull()
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toBe(syncNonNullError.message)
		})
	})

	describe('Handles non-null argument', () => {
		const schemaWithNonNullArg = buildSchema(`
      type Query {
        withNonNullArg(cannotBeNull: String!): String
      }
    `)

		const resolvers = {
			Query: {
				withNonNullArg: (_: unknown, args: Record<string, unknown>) => 'Passed: ' + String(args.cannotBeNull),
			},
		}

		it('succeeds when passed non-null literal value', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query {
            withNonNullArg (cannotBeNull: "literal value")
          }
        `),
				resolvers,
			})

			expect(result).toEqual({
				data: {
					withNonNullArg: 'Passed: literal value',
				},
			})
		})

		it('succeeds when passed non-null variable value', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query ($testVar: String!) {
            withNonNullArg (cannotBeNull: $testVar)
          }
        `),
				variableValues: {
					testVar: 'variable value',
				},
				resolvers,
			})

			expect(result).toEqual({
				data: {
					withNonNullArg: 'Passed: variable value',
				},
			})
		})

		it('succeeds when missing variable has default value', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query ($testVar: String = "default value") {
            withNonNullArg (cannotBeNull: $testVar)
          }
        `),
				variableValues: {},
				resolvers,
			})

			expect(result).toEqual({
				data: {
					withNonNullArg: 'Passed: default value',
				},
			})
		})

		it('field error when missing non-null arg', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query {
            withNonNullArg
          }
        `),
				resolvers,
			})

			expect(result.data).toEqual({ withNonNullArg: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toContain('Argument "cannotBeNull"')
			expect(result.errors?.[0].message).toContain('was not provided')
			expect(result.errors?.[0].path).toEqual(['withNonNullArg'])
		})

		it('field error when non-null arg provided null', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query {
            withNonNullArg(cannotBeNull: null)
          }
        `),
				resolvers,
			})

			expect(result.data).toEqual({ withNonNullArg: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toContain('Argument "cannotBeNull"')
			expect(result.errors?.[0].message).toContain('must not be null')
			expect(result.errors?.[0].path).toEqual(['withNonNullArg'])
		})

		it('field error when non-null arg not provided variable value', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query ($testVar: String) {
            withNonNullArg(cannotBeNull: $testVar)
          }
        `),
				variableValues: {},
				resolvers,
			})

			expect(result.data).toEqual({ withNonNullArg: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toContain('Argument "cannotBeNull"')
			expect(result.errors?.[0].message).toContain('$testVar')
			expect(result.errors?.[0].path).toEqual(['withNonNullArg'])
		})

		it('field error when non-null arg provided variable with explicit null value', () => {
			const result = executeSync({
				schema: schemaWithNonNullArg,
				document: parse(`
          query ($testVar: String) {
            withNonNullArg(cannotBeNull: $testVar)
          }
        `),
				variableValues: { testVar: null },
				resolvers,
			})

			expect(result.data).toEqual({ withNonNullArg: null })
			expect(result.errors).toHaveLength(1)
			expect(result.errors?.[0].message).toContain('Argument "cannotBeNull"')
			expect(result.errors?.[0].message).toContain('must not be null')
			expect(result.errors?.[0].path).toEqual(['withNonNullArg'])
		})
	})
})
