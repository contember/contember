import { Model } from '@contember/schema'
import { execute } from '../../src/test'
import { GQL, SQL } from '../../src/tags'
import { testUuid } from '../../src/testUuid'
import { SchemaBuilder } from '@contember/schema-definition'
import { test } from 'vitest'

test('Filter by has many with additional join', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Language', entity => entity.column('slug', column => column.type(Model.ColumnType.String).unique()))
			.entity('Person', entity =>
				entity
					.column('shortName')
					.oneHasMany('locales', relation =>
						relation.target('PersonLocale').onDelete(Model.OnDelete.cascade).ownedBy('person').ownerNotNull(),
					),
			)
			.entity('PersonLocale', entity =>
				entity
					.unique(['locale', 'person'])
					.manyHasOne('locale', relation => relation.target('Language').notNull())
					.column('urlSlug'),
			)

			.buildSchema(),
		query: GQL`
      query {
        teamMembers: listPerson(
          filter: {
            locales: {
              and: [
                { locale: { slug: { eq: "cs" } } },
                { urlSlug: { null: false } }
              ]
            }
          }
        ) {
          id
          shortName

          locale: localesByLocale(by: { locale: { slug: "cs" } }) {
            urlSlug
          }
        }
      }
		`,
		executes: [
			{
				sql: SQL`
					select "root_"."id" as "root_id", "root_"."short_name" as "root_shortName", "root_"."id" as "root_id"
					from "public"."person" as "root_"
					where exists (select 1
						from "public"."person_locale" as "root_locales"
						left join  "public"."language" as "root_locales_locale" on  "root_locales"."locale_id" = "root_locales_locale"."id"
						where "root_"."id" = "root_locales"."person_id" and "root_locales_locale"."slug" = ? and not("root_locales"."url_slug" is null))`,
				response: { rows: [{ root_id: testUuid(1), root_shortName: 'John' }] },
				parameters: ['cs'],
			},
			{
				sql: SQL`select "root_"."person_id" as "root_person", "root_"."url_slug" as "root_urlSlug", "root_"."id" as "root_id"
from "public"."person_locale" as "root_"
left join "public"."language" as "root_locale" on "root_"."locale_id" = "root_locale"."id"
where "root_locale"."slug" = ? and "root_"."person_id" in (?)`,
				parameters: ['cs', testUuid(1)],
				response: {
					rows: [{ root_person: testUuid(1), root_urlSlug: 'john', root_id: testUuid(2) }],
				},
			},
		],
		return: {
			data: {
				teamMembers: [
					{
						id: testUuid(1),
						locale: {
							urlSlug: 'john',
						},
						shortName: 'John',
					},
				],
			},
		},
	})
})


