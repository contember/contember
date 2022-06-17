import { Schema } from '@contember/schema'
import { InputValidation, PermissionsBuilder, SchemaDefinition } from '@contember/schema-definition'
import * as SM from '@contember/schema-migrations'
import type { Migration } from '@contember/schema-migrations'
import { emptySchema } from '@contember/schema-utils'
import { expect, Page, test, TestInfo } from '@playwright/test'
import fetch from 'node-fetch'
import { createHash } from 'crypto'

// workaround for CommonJS + ESM incompatibilities
const { SchemaDiffer, SchemaMigrator, VERSION_LATEST } = SM
const ModificationHandlerFactory = SM.ModificationHandlerFactory ?? (SM as any).default.ModificationHandlerFactory

export function buildSchema(definitions: SchemaDefinition.ModelDefinition<{}>): Schema {
	const model = SchemaDefinition.createModel(definitions)
	const permissions = PermissionsBuilder.create(model).allowAll().allowCustomPrimary().permissions

	const acl = {
		roles: {
			admin: {
				variables: {},
				stages: '*' as const,
				entities: permissions,
			},
		},
	}

	const validation = InputValidation.parseDefinition(definitions)
	return { acl, model, validation }
}

export function buildMigration(schema: Schema): Migration {
	const modificationHandlerFactory = new ModificationHandlerFactory(ModificationHandlerFactory.defaultFactoryMap)
	const schemaMigrator = new SchemaMigrator(modificationHandlerFactory)
	const schemaDiffer = new SchemaDiffer(schemaMigrator)
	const modifications = schemaDiffer.diffSchemas(emptySchema, schema)

	return {
		version: '2000-01-01-000000',
		name: 'init',
		formatVersion: VERSION_LATEST,
		modifications,
	}
}

export async function sendContemberRequest(path: string, variables: Record<string, any>, query: string) {
	const response = await fetch(`${process.env.CONTEMBER_API_URL}${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${process.env.CONTEMBER_API_TOKEN}`,
		},
		body: JSON.stringify({ query, variables }),
	})

	expect(response.status).toBe(200)
	return await response.json()
}

export async function contemberCreateProject(projectSlug: string): Promise<boolean> {
	const payload = await sendContemberRequest('/tenant', { projectSlug }, `
		mutation($projectSlug: String!) {
			createProject(projectSlug: $projectSlug) {
				ok
				error { code }
			}
		}
	`)

	if (payload.data.createProject.ok) {
		return true

	} else if (payload.data.createProject.error.code === 'ALREADY_EXISTS') {
		return false

	} else {
		throw new Error(payload.data.createProject.error.code)
	}
}

export async function contemberMigrate(projectSlug: string, migrations: Migration[]) {
	const payload = await sendContemberRequest(`/system/${projectSlug}`, { migrations }, `
		mutation($migrations: [Migration!]!) {
			migrate(migrations: $migrations) {
				ok
				error { code }
			}
		}
	`)

	expect(payload.data.migrate.error?.code).toBeUndefined()
	expect(payload.data.migrate.ok).toBe(true)
}

export async function contemberTruncate(projectSlug: string) {
	const payload = await sendContemberRequest(`/system/${projectSlug}`, {}, `
		mutation {
			truncate {
				ok
			}
		}
	`)

	expect(payload.data.truncate.ok).toBe(true)
}

export async function initContemberProjectDev(definitions: SchemaDefinition.ModelDefinition<{}>) {
	const schema = buildSchema(definitions)
	const schemaHash = createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 16)
	const projectSlug = `dev_${schemaHash}`

	if (await contemberCreateProject(projectSlug)) {
		await contemberMigrate(projectSlug, [buildMigration(schema)])
	}

	return projectSlug
}

export async function initContemberProject(testInfo: TestInfo, definitions: SchemaDefinition.ModelDefinition<{}>) {
	const schema = buildSchema(definitions)
	const schemaHash = createHash('sha256').update(JSON.stringify(schema)).digest('hex').slice(0, 16)
	const projectSlug = `test_${schemaHash}_${testInfo.parallelIndex}`

	if (await contemberCreateProject(projectSlug)) {
		await contemberMigrate(projectSlug, [buildMigration(schema)])

	} else {
		await contemberTruncate(projectSlug)
	}

	return projectSlug
}

export function expectNoConsoleErrors(page: Page) {
	page.on('console', msg => {
		if (msg.type() === 'error') {
			console.error(msg.text())
			test.fail()
		}
	})
}
