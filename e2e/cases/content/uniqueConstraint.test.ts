import { c, createSchema } from '@contember/schema-definition'
import { test } from 'bun:test'
import { createTester, gql } from '../../src/tester'

namespace UniqueConstraintModel {
	export class Site {
		slug = c.stringColumn().unique()
	}
}

test('fail when creating a non-unique site', async () => {
	const tester = await createTester(createSchema(UniqueConstraintModel))

	await tester(gql`mutation {
        createSite(data: {slug: "en"}) {
            ok
        }
    }`)
		.expect(200)

	await tester(gql`mutation {
        createSite(data: {slug: "en"}) {
            ok
            errorMessage
        }
    }`)
		.expect(200)
		.expect({
			data: {
				createSite: {
					ok: false,
					errorMessage: 'Execution has failed:\nslug: UniqueConstraintViolation (Value (en) already exists in unique columns (slug) on entity Site)',
				},
			},
		})
})


