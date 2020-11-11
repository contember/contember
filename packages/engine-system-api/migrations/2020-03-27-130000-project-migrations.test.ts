import migration from './2020-03-27-130000-project-migrations'
import { createMigrationBuilder } from '@contember/database-migrations'
import { Migration } from '@contember/schema-migrations'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

test('project-migration sql', async () => {
	const builder = createMigrationBuilder()
	await migration(builder, {
		schemaResolver: () => {
			throw new Error()
		},
		project: {
			slug: 'test',
			stages: [
				{
					name: 'live',
					slug: 'live',
				},
			],
		},
		queryHandler: {
			fetch: (query: any) => {
				return Promise.resolve([
					{
						type: 'run_migration',
						previous_id: 'abcd',
						created_at: new Date('2020-04-01'),
						data: { version: '2018-08-04-102200' },
					},
				]) as any
			},
			queryable: null as any,
		} as any,
		migrationsResolverFactory: project =>
			({
				getMigrations: () => {
					const migration: Migration = {
						formatVersion: 2,
						version: '2018-08-04-102200',
						name: '2018-08-04-102200-init',
						modifications: [
							{
								modification: 'createEntity',
								entity: {
									name: 'Author',
									unique: {},
								},
							},
						],
					}
					return Promise.resolve([migration])
				},
			} as any),
	})
	assert.equal(
		builder.getSql(),
		`CREATE TABLE "system"."schema_migration" (
  "id" SERIAL4 NOT NULL,
  "version" varchar(20) UNIQUE NOT NULL,
  "name" varchar(255) UNIQUE NOT NULL,
  "migration" json NOT NULL,
  "checksum" char(32) NOT NULL,
  "executed_at" timestamp DEFAULT $pga$now()$pga$ NOT NULL
);
CREATE INDEX "system_schema_migration_version" ON "system"."schema_migration" ("version");
INSERT INTO "system"."schema_migration" (version, name, migration, checksum, executed_at)
VALUES (
        $pga$2018-08-04-102200$pga$,
        $pga$2018-08-04-102200-init$pga$,
        $pga\${"formatVersion":2,"version":"2018-08-04-102200","name":"2018-08-04-102200-init","modifications":[{"modification":"createEntity","entity":{"name":"Author","unique":{}}}]}$pga$,
        $pga$6a40afb75a82d745e9ad0a23f71e916d$pga$,
        $pga$2020-04-01T00:00:00.000Z$pga$
        );
`,
	)
})

test.run()
