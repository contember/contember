/**
 * Fills the local engine with enough data that every page of the management panel has something to show.
 *
 * Run: bun --conditions=typescript scripts/dev/seed-local.ts
 *
 * Everything goes through the public APIs (tenant / content / system / actions). The single exception is the
 * `visible_at` nudge in the actions phase, which only skips the retry backoff so the engine itself can drive an
 * event to the terminal `failed` state inside one run — state, payload, target and log stay the engine's own.
 *
 * Idempotent: every row it writes carries the `panel-seed` marker or a fixed id, and each phase is skipped when
 * its marker is already there. Nothing is ever deleted except the two content rows the seed creates to record a
 * delete event in the history.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const ROOT_TOKEN = '0000000000000000000000000000000000000000'
const LOGIN_TOKEN = '1111111111111111111111111111111111111111'
const SEED_PASSWORD = 'Panel-Seed-2026!'

/** Fixed ids so a re-run addresses the same rows instead of creating new ones. */
const ids = {
	authorKept: '5eed0001-0000-4000-8000-000000000001',
	authorRemoved: '5eed0001-0000-4000-8000-000000000002',
	tagKept: '5eed0002-0000-4000-8000-000000000001',
	tagRemoved: '5eed0002-0000-4000-8000-000000000002',
	category: '5eed0003-0000-4000-8000-000000000001',
	actionsEntries: [
		'5eed0004-0000-4000-8000-000000000001',
		'5eed0004-0000-4000-8000-000000000002',
		'5eed0004-0000-4000-8000-000000000003',
		'5eed0004-0000-4000-8000-000000000004',
	],
}

// ---------------------------------------------------------------------------------------------- arguments

type Options = {
	apiUrl: string
	token: string
	loginToken: string
	project: string
	dsn: string | undefined
	sinkUrl: string
	failUrl: string
}

const parseOptions = (argv: readonly string[]): Options => {
	const values = new Map<string, string>()
	for (const arg of argv) {
		const match = /^--([\w-]+)=(.*)$/.exec(arg)
		if (!match) {
			throw new Error(`Unknown argument ${arg}. Use --name=value.`)
		}
		values.set(match[1], match[2])
	}
	const known = ['api-url', 'token', 'login-token', 'project', 'dsn', 'sink-url', 'fail-url']
	for (const key of values.keys()) {
		if (!known.includes(key)) {
			throw new Error(`Unknown option --${key}. Known: ${known.map(it => `--${it}`).join(', ')}`)
		}
	}
	return {
		apiUrl: (values.get('api-url') ?? process.env.CONTEMBER_API_URL ?? 'http://localhost:3001').replace(/\/+$/, ''),
		token: values.get('token') ?? process.env.CONTEMBER_ROOT_TOKEN ?? ROOT_TOKEN,
		loginToken: values.get('login-token') ?? process.env.CONTEMBER_LOGIN_TOKEN ?? LOGIN_TOKEN,
		project: values.get('project') ?? 'playground',
		dsn: values.get('dsn') ?? process.env.DATABASE_URL,
		// Both URLs are dialled by the engine, so they are resolved inside its container, not on the host.
		sinkUrl: values.get('sink-url') ?? 'http://localhost:4000/?panelSeedSink=',
		failUrl: values.get('fail-url') ?? 'http://127.0.0.1:9',
	}
}

// ---------------------------------------------------------------------------------------------- json helpers

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const asRecord = (value: unknown, path: string): Record<string, unknown> => {
	if (!isRecord(value)) {
		throw new Error(`Expected an object at ${path}, got ${JSON.stringify(value)}`)
	}
	return value
}

const asArray = (value: unknown, path: string): readonly unknown[] => {
	if (!Array.isArray(value)) {
		throw new Error(`Expected an array at ${path}, got ${JSON.stringify(value)}`)
	}
	return value
}

const asString = (value: unknown, path: string): string => {
	if (typeof value !== 'string') {
		throw new Error(`Expected a string at ${path}, got ${JSON.stringify(value)}`)
	}
	return value
}

const asOptionalString = (value: unknown, path: string): string | undefined => {
	if (value === null || value === undefined) {
		return undefined
	}
	return asString(value, path)
}

const asBoolean = (value: unknown, path: string): boolean => {
	if (typeof value !== 'boolean') {
		throw new Error(`Expected a boolean at ${path}, got ${JSON.stringify(value)}`)
	}
	return value
}

// ---------------------------------------------------------------------------------------------- graphql

class GraphQlEndpoint {
	constructor(
		private readonly url: string,
		private readonly token: string,
	) {
	}

	async request(query: string, variables: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
		const response = await fetch(this.url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
			body: JSON.stringify({ query, variables }),
		})
		const text = await response.text()
		if (!response.ok) {
			throw new Error(`${this.url} answered HTTP ${response.status}: ${text.slice(0, 400)}`)
		}
		const parsed: unknown = JSON.parse(text)
		const body = asRecord(parsed, 'response')
		const errors = body['errors']
		if (Array.isArray(errors) && errors.length > 0) {
			const messages = errors.map((it, index) => asOptionalString(asRecord(it, `errors[${index}]`)['message'], 'message') ?? '?')
			throw new Error(`${this.url} returned GraphQL errors: ${messages.join('; ')}`)
		}
		return asRecord(body['data'], 'data')
	}
}

/** Shape shared by every tenant mutation: `ok` plus an optional typed error. */
type Outcome = { readonly ok: boolean; readonly code: string | undefined; readonly message: string | undefined }

const readOutcome = (data: Record<string, unknown>, field: string): Outcome => {
	const result = asRecord(data[field], field)
	const error = result['error']
	if (error === null || error === undefined) {
		return { ok: asBoolean(result['ok'], `${field}.ok`), code: undefined, message: undefined }
	}
	const errorRecord = asRecord(error, `${field}.error`)
	return {
		ok: asBoolean(result['ok'], `${field}.ok`),
		code: asOptionalString(errorRecord['code'], `${field}.error.code`),
		message: asOptionalString(errorRecord['developerMessage'], `${field}.error.developerMessage`),
	}
}

/** Fails unless the mutation succeeded or failed with one of the "already there" codes. */
const expectOk = (outcome: Outcome, field: string, tolerated: readonly string[] = []): Outcome => {
	if (!outcome.ok && !(outcome.code !== undefined && tolerated.includes(outcome.code))) {
		throw new Error(`${field} failed: ${outcome.code ?? 'unknown'} — ${outcome.message ?? 'no message'}`)
	}
	return outcome
}

// ---------------------------------------------------------------------------------------------- seed data

type SeedPerson = { readonly email: string; readonly name: string; readonly role: string }

const seedPersons: readonly SeedPerson[] = [
	{ email: 'panel-admin@localhost', name: 'Petra Admin', role: 'admin' },
	{ email: 'panel-deployer@localhost', name: 'Deploy Robot', role: 'deployer' },
	{ email: 'panel-editor@localhost', name: 'Eva Editor', role: 'content_admin' },
	{ email: 'panel-guest@localhost', name: 'Gustav Guest', role: 'noVar' },
]

const projectApiKeyDescription = 'CI deploy key (GitHub Actions)'
const globalApiKeyDescription = 'Provisioning key (internal ops tooling)'

const seedSecrets: readonly (readonly [string, string])[] = [
	['webhookSigningSecret', 'panel-seed-whsec-4f1c9a2b'],
	['analytics.apiToken', 'panel-seed-token-8d3e1077'],
]

const log = (message: string): void => console.log(message)

// ---------------------------------------------------------------------------------------------- preconditions

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))

const countExecutedMigrations = async (system: GraphQlEndpoint): Promise<number> => {
	const data = await system.request('{ executedMigrations { version } }')
	return asArray(data['executedMigrations'], 'executedMigrations').length
}

const ensureMigrations = async (system: GraphQlEndpoint, project: string): Promise<number> => {
	const executed = await countExecutedMigrations(system)
	if (executed > 0) {
		return executed
	}
	log(`Project ${project} has no executed migrations — running the CLI.`)
	const result = spawnSync('docker', ['compose', 'run', '--rm', 'cli', 'migrations:execute', '--yes'], { cwd: repoRoot, stdio: 'inherit' })
	if (result.status !== 0) {
		throw new Error(
			`Could not migrate ${project}. Run this yourself and then re-run the seed:\n`
				+ '  docker compose run --rm cli migrations:execute --yes',
		)
	}
	const after = await countExecutedMigrations(system)
	if (after === 0) {
		throw new Error(`Project ${project} still reports no executed migrations. Run: docker compose run --rm cli migrations:execute --yes`)
	}
	return after
}

// ---------------------------------------------------------------------------------------------- tenant

type FoundPerson = { readonly personId: string; readonly identityId: string; readonly name: string | undefined }

const findPerson = async (tenant: GraphQlEndpoint, email: string): Promise<FoundPerson | undefined> => {
	const data = await tenant.request('query($email: String!) { persons(filter: { email: $email }) { id name identity { id } } }', { email })
	const persons = asArray(data['persons'], 'persons')
	if (persons.length === 0) {
		return undefined
	}
	const person = asRecord(persons[0], 'persons[0]')
	return {
		personId: asString(person['id'], 'person.id'),
		identityId: asString(asRecord(person['identity'], 'identity')['id'], 'identity.id'),
		name: asOptionalString(person['name'], 'person.name'),
	}
}

/** `unmanagedInvite` ignores its `name` argument, so the display name has to be set separately. */
const setPersonName = async (tenant: GraphQlEndpoint, personId: string, name: string): Promise<void> => {
	expectOk(
		readOutcome(
			await tenant.request(
				'mutation($personId: String!, $name: String!) { changeProfile(personId: $personId, name: $name) { ok error { code developerMessage } } }',
				{
					personId,
					name,
				},
			),
			'changeProfile',
		),
		'changeProfile',
	)
}

const seedPeople = async (tenant: GraphQlEndpoint, project: string): Promise<number> => {
	let created = 0
	for (const person of seedPersons) {
		const memberships = [{ role: person.role, variables: [] }]
		// `unmanagedInvite` re-invites happily and writes a person_invite audit entry each time, so look first.
		const existing = await findPerson(tenant, person.email)
		if (existing === undefined) {
			expectOk(
				readOutcome(
					await tenant.request(
						`mutation($email: String!, $project: String!, $memberships: [MembershipInput!]!, $password: String!) {
							unmanagedInvite(email: $email, projectSlug: $project, memberships: $memberships, options: { password: $password }) {
								ok
								error { code developerMessage }
								result { person { id } }
							}
						}`,
						{ email: person.email, project, memberships, password: SEED_PASSWORD },
					),
					'unmanagedInvite',
				),
				'unmanagedInvite',
				['ALREADY_MEMBER'],
			)
			const invited = await findPerson(tenant, person.email)
			if (invited !== undefined) {
				await setPersonName(tenant, invited.personId, person.name)
			}
			created++
			continue
		}
		if (existing.name !== person.name) {
			await setPersonName(tenant, existing.personId, person.name)
		}
		const update = readOutcome(
			await tenant.request(
				`mutation($project: String!, $identityId: String!, $memberships: [MembershipInput!]!) {
					updateProjectMember(projectSlug: $project, identityId: $identityId, memberships: $memberships) { ok error { code developerMessage } }
				}`,
				{ project, identityId: existing.identityId, memberships },
			),
			'updateProjectMember',
		)
		if (update.code === 'NOT_MEMBER') {
			expectOk(
				readOutcome(
					await tenant.request(
						`mutation($project: String!, $identityId: String!, $memberships: [MembershipInput!]!) {
							addProjectMember(projectSlug: $project, identityId: $identityId, memberships: $memberships) { ok error { code developerMessage } }
						}`,
						{ project, identityId: existing.identityId, memberships },
					),
					'addProjectMember',
				),
				'addProjectMember',
				['ALREADY_MEMBER'],
			)
			continue
		}
		expectOk(update, 'updateProjectMember')
	}
	return created
}

const seedApiKeys = async (tenant: GraphQlEndpoint, project: string): Promise<number> => {
	let created = 0
	const existing = await tenant.request(
		'query($project: String!) { projectBySlug(slug: $project) { apiKeys { description } } globalApiKeys { description } }',
		{
			project,
		},
	)
	const projectKeys = asArray(asRecord(existing['projectBySlug'], 'projectBySlug')['apiKeys'], 'apiKeys')
		.map((it, index) => asOptionalString(asRecord(it, `apiKeys[${index}]`)['description'], 'description'))
	const globalKeys = asArray(existing['globalApiKeys'], 'globalApiKeys')
		.map((it, index) => asOptionalString(asRecord(it, `globalApiKeys[${index}]`)['description'], 'description'))

	if (!projectKeys.includes(projectApiKeyDescription)) {
		const data = await tenant.request(
			`mutation($project: String!, $memberships: [MembershipInput!]!, $description: String!) {
				createApiKey(projectSlug: $project, memberships: $memberships, description: $description) {
					ok
					error { code developerMessage }
					result { apiKey { id token } }
				}
			}`,
			{ project, memberships: [{ role: 'deployer', variables: [] }], description: projectApiKeyDescription },
		)
		expectOk(readOutcome(data, 'createApiKey'), 'createApiKey')
		const token = asRecord(asRecord(asRecord(data['createApiKey'], 'createApiKey')['result'], 'result')['apiKey'], 'apiKey')['token']
		log(`  project api key token (shown once): ${asOptionalString(token, 'token') ?? '<hidden>'}`)
		created++
	}

	if (!globalKeys.includes(globalApiKeyDescription)) {
		const data = await tenant.request(
			`mutation($description: String!, $roles: [String!]) {
				createGlobalApiKey(description: $description, roles: $roles) {
					ok
					error { code developerMessage }
					result { apiKey { id token } }
				}
			}`,
			{ description: globalApiKeyDescription, roles: ['project_creator'] },
		)
		expectOk(readOutcome(data, 'createGlobalApiKey'), 'createGlobalApiKey')
		const token = asRecord(asRecord(asRecord(data['createGlobalApiKey'], 'createGlobalApiKey')['result'], 'result')['apiKey'], 'apiKey')['token']
		log(`  global api key token (shown once): ${asOptionalString(token, 'token') ?? '<hidden>'}`)
		created++
	}
	return created
}

/** Secrets need CONTEMBER_ENCRYPTION_KEY on the engine; without it the mutation throws and the page stays empty. */
const seedSecretsForProject = async (tenant: GraphQlEndpoint, project: string): Promise<number> => {
	for (const [key, value] of seedSecrets) {
		try {
			expectOk(
				readOutcome(
					await tenant.request(
						`mutation($project: String!, $key: String!, $value: String!) {
							setProjectSecret(projectSlug: $project, key: $key, value: $value) { ok error { code developerMessage } }
						}`,
						{ project, key, value },
					),
					'setProjectSecret',
				),
				'setProjectSecret',
			)
		} catch (error) {
			log(`  skipped: setProjectSecret failed (${error instanceof Error ? error.message : String(error)})`)
			log('  set CONTEMBER_ENCRYPTION_KEY (64 hex chars) on the engine service to store project secrets')
			return 0
		}
	}
	return seedSecrets.length
}

/** Only `login` rows — a person also produces `person_invite` entries, which must not look like a sign-in. */
const countSeedSignIns = async (tenant: GraphQlEndpoint): Promise<{ succeeded: number; failed: number }> => {
	let succeeded = 0
	let failed = 0
	for (const person of seedPersons) {
		const data = await tenant.request(
			'query($email: String!) { authLog(filter: { types: ["login"], personInputIdentifier: $email }, limit: 500) { entries { success } } }',
			{ email: person.email },
		)
		for (const [index, entry] of asArray(asRecord(data['authLog'], 'authLog')['entries'], 'entries').entries()) {
			if (asBoolean(asRecord(entry, `entries[${index}]`)['success'], 'success')) {
				succeeded++
			} else {
				failed++
			}
		}
	}
	return { succeeded, failed }
}

const signIn = async (login: GraphQlEndpoint, email: string, password: string): Promise<boolean> => {
	const data = await login.request(
		'mutation($email: String!, $password: String!) { signIn(email: $email, password: $password) { ok error { code developerMessage } } }',
		{ email, password },
	)
	return readOutcome(data, 'signIn').ok
}

/** Two successful sign-ins and one wrong password, so the auth log carries both outcomes. */
const seedAuthLog = async (tenant: GraphQlEndpoint, login: GraphQlEndpoint): Promise<number> => {
	const before = await countSeedSignIns(tenant)
	if (before.succeeded > 0 && before.failed > 0) {
		return 0
	}
	let written = 0
	for (const email of ['panel-admin@localhost', 'panel-editor@localhost']) {
		if (!await signIn(login, email, SEED_PASSWORD)) {
			throw new Error(`Sign-in as ${email} failed although the seed just created the account`)
		}
		written++
	}
	if (await signIn(login, 'panel-guest@localhost', 'definitely-not-the-password')) {
		throw new Error('The deliberately wrong password was accepted — refusing to pretend this is a failed sign-in')
	}
	return written + 1
}

// ---------------------------------------------------------------------------------------------- content history

const contentMutation = async (content: GraphQlEndpoint, field: string, query: string, variables: Record<string, unknown>): Promise<void> => {
	const data = await content.request(query, variables)
	const result = asRecord(data[field], field)
	if (!asBoolean(result['ok'], `${field}.ok`)) {
		throw new Error(`${field} failed: ${asOptionalString(result['errorMessage'], `${field}.errorMessage`) ?? 'no message'}`)
	}
}

/** Creates, updates and deletes rows in three tables so `system.event_data` holds all three event types. */
const seedHistory = async (content: GraphQlEndpoint): Promise<{ created: number; updated: number; deleted: number }> => {
	// Both halves only hold after a complete pass: the kept row exists and the deleted one is gone again.
	const existing = await content.request(
		'query($kept: UUID!, $removed: UUID!) { getGridAuthor(by: { id: $kept }) { id } getBoardTag(by: { id: $removed }) { id } }',
		{
			kept: ids.authorKept,
			removed: ids.tagRemoved,
		},
	)
	if (existing['getGridAuthor'] !== null && existing['getBoardTag'] === null) {
		return { created: 0, updated: 0, deleted: 0 }
	}

	// Upserts so an interrupted earlier pass repairs itself instead of colliding on the fixed ids.
	await contentMutation(
		content,
		'upsertGridAuthor',
		`mutation($id: UUID!) {
			upsertGridAuthor(
				by: { id: $id }
				update: { name: "Panel Seed Author" }
				create: { id: $id, name: "Panel Seed Author", slug: "panel-seed-author-kept" }
			) {
				ok
				errorMessage
			}
		}`,
		{ id: ids.authorKept },
	)
	await contentMutation(
		content,
		'upsertGridAuthor',
		`mutation($id: UUID!) {
			upsertGridAuthor(
				by: { id: $id }
				update: { name: "Temporary Author" }
				create: { id: $id, name: "Temporary Author", slug: "panel-seed-author-removed" }
			) {
				ok
				errorMessage
			}
		}`,
		{ id: ids.authorRemoved },
	)
	await contentMutation(
		content,
		'upsertBoardTag',
		`mutation($id: UUID!) {
			upsertBoardTag(
				by: { id: $id }
				update: { name: "Panel Seed Tag", color: "#2f6fed" }
				create: { id: $id, name: "Panel Seed Tag", slug: "panel-seed-tag-kept", color: "#2f6fed" }
			) {
				ok
				errorMessage
			}
		}`,
		{ id: ids.tagKept },
	)
	await contentMutation(
		content,
		'upsertBoardTag',
		`mutation($id: UUID!) {
			upsertBoardTag(
				by: { id: $id }
				update: { name: "Temporary Tag", color: "#999999" }
				create: { id: $id, name: "Temporary Tag", slug: "panel-seed-tag-removed", color: "#999999" }
			) {
				ok
				errorMessage
			}
		}`,
		{ id: ids.tagRemoved },
	)
	await contentMutation(
		content,
		'upsertGridCategory',
		`mutation($id: UUID!) {
			upsertGridCategory(
				by: { id: $id }
				update: { name: "Panel Seed Category" }
				create: { id: $id, name: "Panel Seed Category", slug: "panel-seed-category" }
			) {
				ok
				errorMessage
			}
		}`,
		{ id: ids.category },
	)

	await contentMutation(
		content,
		'updateGridAuthor',
		'mutation($id: UUID!) { updateGridAuthor(by: { id: $id }, data: { name: "Panel Seed Author (renamed)" }) { ok errorMessage } }',
		{ id: ids.authorKept },
	)
	await contentMutation(
		content,
		'updateBoardTag',
		'mutation($id: UUID!) { updateBoardTag(by: { id: $id }, data: { color: "#e0483d" }) { ok errorMessage } }',
		{ id: ids.tagKept },
	)
	await contentMutation(
		content,
		'updateGridCategory',
		'mutation($id: UUID!) { updateGridCategory(by: { id: $id }, data: { name: "Panel Seed Category (renamed)" }) { ok errorMessage } }',
		{ id: ids.category },
	)

	await contentMutation(content, 'deleteGridAuthor', 'mutation($id: UUID!) { deleteGridAuthor(by: { id: $id }) { ok errorMessage } }', {
		id: ids.authorRemoved,
	})
	await contentMutation(content, 'deleteBoardTag', 'mutation($id: UUID!) { deleteBoardTag(by: { id: $id }) { ok errorMessage } }', {
		id: ids.tagRemoved,
	})

	return { created: 5, updated: 3, deleted: 2 }
}

// ---------------------------------------------------------------------------------------------- actions

type ActionsEventSummary = { readonly id: string; readonly state: string; readonly attempts: number }

const setActionsUrl = async (actions: GraphQlEndpoint, url: string): Promise<void> => {
	const data = await actions.request(
		'mutation($url: String!) { setVariables(args: { variables: [{ name: "url", value: $url }], mode: MERGE }) { ok } }',
		{
			url,
		},
	)
	if (!asBoolean(asRecord(data['setVariables'], 'setVariables')['ok'], 'setVariables.ok')) {
		throw new Error('setVariables did not report ok')
	}
}

const processBatch = async (actions: GraphQlEndpoint): Promise<void> => {
	await actions.request('mutation { processBatch { ok } }')
}

/** A batch is one event by default, so the queue only empties if processBatch is called until nothing is visible. */
const drainQueue = async (actions: GraphQlEndpoint, maxRounds: number): Promise<void> => {
	for (let round = 0; round < maxRounds; round++) {
		if ((await pendingEventIds(actions)).length === 0) {
			return
		}
		await processBatch(actions)
	}
	throw new Error(`The actions queue still has visible events after ${maxRounds} batches`)
}

const readEvent = async (actions: GraphQlEndpoint, id: string): Promise<ActionsEventSummary> => {
	const data = await actions.request('query($id: UUID!) { event(id: $id) { id state numRetries } }', { id })
	const event = asRecord(data['event'], 'event')
	const retries = event['numRetries']
	if (typeof retries !== 'number') {
		throw new Error('event.numRetries is not a number')
	}
	return { id: asString(event['id'], 'event.id'), state: asString(event['state'], 'event.state'), attempts: retries }
}

const pendingEventIds = async (actions: GraphQlEndpoint): Promise<readonly string[]> => {
	const data = await actions.request('{ eventsToProcess(args: { limit: 200 }) { id } }')
	return asArray(data['eventsToProcess'], 'eventsToProcess').map((it, index) => asString(asRecord(it, `eventsToProcess[${index}]`)['id'], 'id'))
}

/** Touches a watched row and returns the id of the event that appeared because of it. */
const emitEvent = async (content: GraphQlEndpoint, actions: GraphQlEndpoint, entryId: string, value: string): Promise<string> => {
	const before = new Set(await pendingEventIds(actions))
	await contentMutation(
		content,
		'updateActionsEntry',
		'mutation($id: UUID!, $value: String!) { updateActionsEntry(by: { id: $id }, data: { value: $value }) { ok errorMessage } }',
		{ id: entryId, value },
	)
	const fresh = (await pendingEventIds(actions)).filter(it => !before.has(it))
	if (fresh.length !== 1) {
		throw new Error(`Expected exactly one new actions event after touching ${entryId}, saw ${fresh.length}`)
	}
	return fresh[0]
}

type ActionsResult = { readonly events: readonly ActionsEventSummary[]; readonly nudged: readonly string[]; readonly skipped: boolean }

/** Value of the last row the phase touches — present only once the whole phase has run through. */
const lastActionsValue = 'panel-seed entry 4 — never dispatched'

const seedActions = async (content: GraphQlEndpoint, actions: GraphQlEndpoint, sql: Client, options: Options): Promise<ActionsResult> => {
	const existing = await content.request('query($id: UUID!) { getActionsEntry(by: { id: $id }) { value } }', { id: ids.actionsEntries[3] })
	const existingEntry = existing['getActionsEntry']
	if (existingEntry !== null && asOptionalString(asRecord(existingEntry, 'getActionsEntry')['value'], 'value') === lastActionsValue) {
		return { events: [], nudged: [], skipped: true }
	}

	// Phase 1 — a target that answers 200, so the succeeded events are real deliveries.
	await setActionsUrl(actions, options.sinkUrl)
	const succeeded: string[] = []
	for (const [index, entryId] of ids.actionsEntries.entries()) {
		const before = new Set(await pendingEventIds(actions))
		const value = `panel-seed entry ${index + 1}`
		await contentMutation(
			content,
			'upsertActionsEntry',
			`mutation($id: UUID!, $value: String!) {
				upsertActionsEntry(by: { id: $id }, update: { value: $value }, create: { id: $id, value: $value }) { ok errorMessage }
			}`,
			{ id: entryId, value },
		)
		const fresh = (await pendingEventIds(actions)).filter(it => !before.has(it))
		succeeded.push(...fresh)
	}
	await drainQueue(actions, succeeded.length + 5)

	// Phase 2 — an unreachable target, so every further attempt fails for real.
	await setActionsUrl(actions, options.failUrl)
	const nudged: string[] = []

	// `failed` is terminal only after the attempts are exhausted; nudging visible_at skips the backoff wait.
	const failing = await emitEvent(content, actions, ids.actionsEntries[0], 'panel-seed entry 1 — retried to exhaustion')
	let failedState = await readEvent(actions, failing)
	for (let round = 0; round < 20 && failedState.state !== 'failed'; round++) {
		await processBatch(actions)
		failedState = await readEvent(actions, failing)
		if (failedState.state === 'retrying') {
			await sql.query('UPDATE system.actions_event SET visible_at = now() WHERE id = $1 AND state = $2', [failing, 'retrying'])
			nudged.push(failing)
		}
	}

	const stopping = await emitEvent(content, actions, ids.actionsEntries[1], 'panel-seed entry 2 — stopped by hand')
	await processBatch(actions)
	await actions.request('mutation($id: UUID!) { stopEvent(id: $id) { ok } }', { id: stopping })

	const retrying = await emitEvent(content, actions, ids.actionsEntries[2], 'panel-seed entry 3 — waiting for the next retry')
	await processBatch(actions)

	const untouched = await emitEvent(content, actions, ids.actionsEntries[3], lastActionsValue)

	const all = [...succeeded, failing, stopping, retrying, untouched]
	const events: ActionsEventSummary[] = []
	for (const id of all) {
		events.push(await readEvent(actions, id))
	}
	return { events, nudged: [...new Set(nudged)], skipped: false }
}

// ---------------------------------------------------------------------------------------------- summary

const summarize = async (tenant: GraphQlEndpoint, system: GraphQlEndpoint, actions: GraphQlEndpoint, project: string): Promise<void> => {
	const tenantData = await tenant.request(
		`query($project: String!) {
			projectBySlug(slug: $project) { members { identity { id } } apiKeys { description } secrets { key } }
			globalApiKeys { description }
		}`,
		{ project },
	)
	const projectData = asRecord(tenantData['projectBySlug'], 'projectBySlug')
	log(`  members on ${project}: ${asArray(projectData['members'], 'members').length}`)
	log(`  project api keys: ${asArray(projectData['apiKeys'], 'apiKeys').length}`)
	log(`  project secrets: ${asArray(projectData['secrets'], 'secrets').length}`)
	log(`  global api keys: ${asArray(tenantData['globalApiKeys'], 'globalApiKeys').length}`)
	const signIns = await countSeedSignIns(tenant)
	log(`  sign-ins by seeded persons in the auth log: ${signIns.succeeded} ok, ${signIns.failed} failed`)

	for (const type of ['CREATE', 'UPDATE', 'DELETE']) {
		const data = await system.request('query($type: EventType!) { events(args: { filter: { types: [$type] }, limit: 10000 }) { id } }', { type })
		log(`  history ${type.toLowerCase()} events: ${asArray(data['events'], 'events').length}`)
	}
	const migrations = await system.request('{ executedMigrations { version } stages { slug } }')
	log(`  executed migrations: ${asArray(migrations['executedMigrations'], 'executedMigrations').length}`)
	log(`  stages: ${asArray(migrations['stages'], 'stages').map((it, index) => asString(asRecord(it, `stages[${index}]`)['slug'], 'slug')).join(', ')}`)

	// The API lists only the non-terminal queues; succeed / stopped events are reachable one id at a time.
	const queue = await actions.request(
		'{ eventsToProcess(args: { limit: 500 }) { id } failedEvents(args: { limit: 500 }) { id } variables { name value } }',
	)
	log(`  actions events waiting to process: ${asArray(queue['eventsToProcess'], 'eventsToProcess').length}`)
	log(`  actions events failed or retrying: ${asArray(queue['failedEvents'], 'failedEvents').length}`)
	const variables = asArray(queue['variables'], 'variables')
		.map((it, index) => {
			const variable = asRecord(it, `variables[${index}]`)
			return `${asString(variable['name'], 'name')}=${asString(variable['value'], 'value')}`
		})
	log(`  actions variables: ${variables.join(', ')}`)
}

// ---------------------------------------------------------------------------------------------- main

const main = async (): Promise<void> => {
	const options = parseOptions(process.argv.slice(2))
	const tenant = new GraphQlEndpoint(`${options.apiUrl}/tenant`, options.token)
	const login = new GraphQlEndpoint(`${options.apiUrl}/tenant`, options.loginToken)
	const system = new GraphQlEndpoint(`${options.apiUrl}/system/${options.project}`, options.token)
	const content = new GraphQlEndpoint(`${options.apiUrl}/content/${options.project}/live`, options.token)
	const actions = new GraphQlEndpoint(`${options.apiUrl}/actions/${options.project}`, options.token)

	log(`Seeding ${options.project} through ${options.apiUrl}`)

	const project = asRecord(
		(await tenant.request('query($project: String!) { projectBySlug(slug: $project) { slug } }', { project: options.project }))['projectBySlug'],
		'projectBySlug',
	)
	log(`Project ${asString(project['slug'], 'slug')} found.`)

	const migrations = await ensureMigrations(system, options.project)
	log(`Migrations executed: ${migrations}`)

	log('Tenant: persons and memberships')
	const createdPersons = await seedPeople(tenant, options.project)
	log(`  new persons: ${createdPersons} (of ${seedPersons.length})`)

	log('Tenant: api keys')
	log(`  new api keys: ${await seedApiKeys(tenant, options.project)}`)

	log('Tenant: project secrets')
	log(`  secrets set: ${await seedSecretsForProject(tenant, options.project)}`)

	log('Tenant: auth log')
	const authWritten = await seedAuthLog(tenant, login)
	log(authWritten === 0 ? '  already seeded, no new sign-ins' : `  sign-in attempts recorded: ${authWritten}`)

	log('Content: history')
	const history = await seedHistory(content)
	log(
		history.created === 0
			? '  already seeded, no new rows'
			: `  rows created ${history.created}, updated ${history.updated}, deleted ${history.deleted}`,
	)

	log('Actions: variables, events and dispatch')
	const sql = new Client(
		options.dsn !== undefined ? { connectionString: options.dsn } : {
			host: process.env.PGHOST ?? 'localhost',
			port: Number(process.env.PGPORT ?? '3005'),
			user: process.env.PGUSER ?? 'contember',
			password: process.env.PGPASSWORD ?? 'contember',
			database: process.env.PGDATABASE ?? options.project,
		},
	)
	await sql.connect()
	try {
		const result = await seedActions(content, actions, sql, options)
		if (result.skipped) {
			log('  already seeded, no new events')
		} else {
			const states = new Map<string, number>()
			for (const event of result.events) {
				states.set(event.state, (states.get(event.state) ?? 0) + 1)
			}
			log(`  events by state: ${[...states].map(([state, count]) => `${state}=${count}`).join(', ')}`)
			for (const event of result.events) {
				log(`    ${event.id} ${event.state} after ${event.attempts} attempt(s)`)
			}
			if (result.nudged.length > 0) {
				log(`  SQL-nudged rows (visible_at only, to skip the retry backoff): ${result.nudged.join(', ')}`)
				log("  their state, payload, target and log are the engine's own — nothing else was written by hand")
			}
		}
	} finally {
		await sql.end()
	}

	log('')
	log('Now in the local engine:')
	await summarize(tenant, system, actions, options.project)
	log('')
	log(`Open http://localhost:3001/panel (sign in as ${seedPersons[0].email} / ${SEED_PASSWORD}, or admin@localhost / admin@localhost)`)
}

await main()
