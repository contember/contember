import { expect, test } from 'bun:test'
import { apiUrl, createTester, gql, withTestTransaction } from '../src/tester'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'

namespace AuthorModel {
	export class Author {
		name = def.stringColumn().notNull()
	}
}

// Test transactions are opt-in (CONTEMBER_TEST_TRANSACTIONS) and refuse to run under
// NODE_ENV=production, so the endpoint is absent in the standard CI e2e run. Probe once and
// skip when unavailable; run locally with the flag enabled.
const testTransactionsAvailable = await (async (): Promise<boolean> => {
	try {
		const res = await fetch(apiUrl + '/test/transaction', { method: 'POST' })
		if (!res.ok) {
			return false
		}
		const { token } = await res.json() as { token: string }
		await fetch(apiUrl + '/test/transaction', { method: 'DELETE', headers: { 'X-Contember-Test-Session': token } })
		return true
	} catch {
		return false
	}
})()

const countAuthors = async (tester: Awaited<ReturnType<typeof createTester>>): Promise<number> => {
	const res = await tester(gql`query { paginateAuthor { pageInfo { totalCount } } }`).expect(200)
	return res.body.data.paginateAuthor.pageInfo.totalCount
}

const createAuthor = (tester: Awaited<ReturnType<typeof createTester>>, name: string) =>
	tester(gql`mutation($name: String!) { createAuthor(data: { name: $name }) { ok } }`, { variables: { name } }).expect(200)

test.skipIf(!testTransactionsAvailable)('test transaction: writes inside are rolled back', async () => {
	const tester = await createTester(createSchema(AuthorModel))

	expect(await countAuthors(tester)).toBe(0)

	await withTestTransaction(async () => {
		await createAuthor(tester, 'Kafka')
		await createAuthor(tester, 'Čapek')
		// a later request in the same session sees earlier uncommitted writes
		expect(await countAuthors(tester)).toBe(2)
	})

	// after rollback the baseline is restored
	expect(await countAuthors(tester)).toBe(0)
})

test.skipIf(!testTransactionsAvailable)('test transaction: consecutive tests are isolated', async () => {
	const tester = await createTester(createSchema(AuthorModel))

	for (const name of ['a', 'b', 'c']) {
		await withTestTransaction(async () => {
			expect(await countAuthors(tester)).toBe(0)
			await createAuthor(tester, name)
			expect(await countAuthors(tester)).toBe(1)
		})
	}

	expect(await countAuthors(tester)).toBe(0)
})
