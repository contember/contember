import { AclDefinition as acl, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { PermissionFactory } from '../../../../../../src/index.js'
import { testUuid } from '../../../../../src/testUuid.js'

namespace RowPredicateSubset {
	export const ownerRole = acl.createRole('owner')
	export const personIdVariable = acl.createPredefinedVariable('personId', 'personID', ownerRole)

	@acl.allow(ownerRole, {
		read: true,
		when: { resource: acl.canRead('item') },
	})
	export class Item {
		resource = def.oneHasOne(Resource, 'item')
	}

	@acl.allow(ownerRole, {
		read: true,
		when: { owner: acl.canRead('resources') },
	})
	export class Resource {
		item = def.oneHasOneInverse(Item, 'resource')
		owner = def.manyHasOne(Person, 'resources')
	}

	@acl.allow(ownerRole, {
		read: true,
		when: { personId: personIdVariable },
	})
	export class Person {
		personId = def.uuidColumn().notNull()
		resources = def.oneHasMany(Resource, 'owner')
	}
}

test('owner predicate with isNull', async () => {
	const schema = createSchema(RowPredicateSubset)

	const permissions = new PermissionFactory().create(schema, ['owner'])

	await execute({
		schema: schema.model,
		permissions: permissions,
		variables: {
			owner__personId: { eq: testUuid(0) },
		},
		query: GQL`
        query {
          listItem(filter: {resource: {id: {isNull: true}}}) {
          	id
          }
        }`,
		executes: [
			{
				// `{ resource: { id: { isNull: true } } }` means "no READABLE resource", so it lowers to
				// `NOT EXISTS(<a present readable resource>)` — the resource read predicate lives inside the
				// subquery. This is null-safe (EXISTS never yields NULL) and a present-but-unreadable resource
				// looks absent (no existence leak). The trailing `person_id = ?` is the Item root read predicate.
				// See #895 / #897.
				sql: SQL`select "root_"."id" as "root_id"  from "public"."item" as "root_"
    left join  "public"."resource" as "root_resource" on  "root_"."resource_id" = "root_resource"."id"
    left join  "public"."person" as "root_resource_owner" on  "root_resource"."owner_id" = "root_resource_owner"."id"
	where not(exists (select 1  from "public"."resource" as "root_resource"
    left join  "public"."person" as "root_resource_owner" on  "root_resource"."owner_id" = "root_resource_owner"."id"
	where "root_"."resource_id" = "root_resource"."id" and "root_resource_owner"."person_id" = ?)) and "root_resource_owner"."person_id" = ?`,
				response: {
					rows: [],
				},
			},
		],
		return: {
			data: {
				listItem: [],
			},
		},
	})
})
