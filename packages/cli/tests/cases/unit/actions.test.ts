import { beforeAll, describe, expect, test } from 'bun:test'
import chalk from 'chalk'
import { CliError, ExitCode, Output, OutputStream, renderCliError } from '@contember/cli-common'
import { GraphQlClient } from '@contember/graphql-client'
import { RemoteProjectResolver } from '../../../src/lib/project/RemoteProjectResolver.js'
import { ActionsApi, ActionsClient, Event, Variable } from '../../../src/lib/actions/ActionsClient.js'
import { ActionsClientResolver, resolveActionsClient } from '../../../src/lib/actions/resolveActionsClient.js'
import { runActionMutationBatch } from '../../../src/lib/actions/runActionMutationBatch.js'
import { ActionsListFailedEventsCommand } from '../../../src/commands/actions/ActionsListFailedEventsCommand.js'
import { ActionsListVariablesCommand } from '../../../src/commands/actions/ActionsListVariablesCommand.js'
import { ActionsSetVariablesCommand } from '../../../src/commands/actions/ActionsSetVariablesCommand.js'
import { ActionsGetEventCommand } from '../../../src/commands/actions/ActionsGetEventCommand.js'
import { ActionsRetryEventCommand } from '../../../src/commands/actions/ActionsRetryEventCommand.js'
import { ActionsStopEventCommand } from '../../../src/commands/actions/ActionsStopEventCommand.js'

beforeAll(() => {
	// deterministic assertions regardless of the terminal the suite runs in
	chalk.level = 0
})

// Mirrors packages/cli-common/tests/lib/testOutput.ts — that helper isn't part of the package's
// public exports, so it can't be imported across the package boundary (see deploy.test.ts).
class CapturingStream implements OutputStream {
	public chunks: string[] = []

	constructor(public readonly isTty: boolean = false) {}

	public write(text: string): void {
		this.chunks.push(text)
	}

	public get text(): string {
		return this.chunks.join('')
	}

	public get lines(): string[] {
		return this.text.split('\n').filter(it => it !== '')
	}
}

const createTestOutput = () => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream()
	return { stdout, stderr, output: new Output({ stdout, stderr }) }
}

// a RemoteProjectResolver instance is required by every command's constructor, but resolverFor()
// below never delegates to it — the fake ActionsClientResolver ignores it entirely
const remoteProjectResolver = new RemoteProjectResolver({})

const fakeApi = (overrides: Partial<ActionsApi>): ActionsApi => ({
	listVariables: async () => [],
	setVariables: async () => true,
	listFailedEvents: async () => [],
	retryEvent: async () => true,
	stopEvent: async () => true,
	getEvent: async () => null,
	...overrides,
})

const resolverFor = (api: ActionsApi): ActionsClientResolver => async () => api

const sampleEvent: Event = {
	id: 'evt-1',
	createdAt: '2024-01-01T00:00:00.000Z',
	lastStateChange: '2024-01-01T00:01:00.000Z',
	visibleAt: null,
	numRetries: 2,
	state: 'failed',
	target: 'webhook',
	payload: { foo: 'bar' },
	log: [{ message: 'boom' }],
}

describe('actions failed-events', () => {
	test('--json prints the raw event array, unmodified by the human column mapping', async () => {
		const command = new ActionsListFailedEventsCommand(remoteProjectResolver, resolverFor(fakeApi({ listFailedEvents: async () => [sampleEvent] })))
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual([sampleEvent])
		expect(stderr.text).toBe('')
	})

	test('-q prints bare event ids, one per line', async () => {
		const second: Event = { ...sampleEvent, id: 'evt-2' }
		const command = new ActionsListFailedEventsCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({ listFailedEvents: async () => [sampleEvent, second] })),
		)
		const { output, stdout } = createTestOutput()

		const code = await command.run(['-q'], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.lines).toStrictEqual(['evt-1', 'evt-2'])
	})

	test('an empty JSON list remains one parseable document without human diagnostics', async () => {
		const command = new ActionsListFailedEventsCommand(remoteProjectResolver, resolverFor(fakeApi({ listFailedEvents: async () => [] })))
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual([])
		expect(stderr.text).toBe('')
	})

	test('human mode renders a table on stdout', async () => {
		const command = new ActionsListFailedEventsCommand(remoteProjectResolver, resolverFor(fakeApi({ listFailedEvents: async () => [sampleEvent] })))
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run([], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.text).toContain('evt-1')
		expect(stdout.text).toContain('webhook')
		expect(stderr.text).toBe('')
	})

	test('the log column is summarised to its last entry in human mode, but --json keeps the full history', async () => {
		const eventWithLog: Event = { ...sampleEvent, log: [{ message: 'first' }, { message: 'second' }] }
		const command = new ActionsListFailedEventsCommand(remoteProjectResolver, resolverFor(fakeApi({ listFailedEvents: async () => [eventWithLog] })))

		const human = createTestOutput()
		const humanCode = await command.run([], human.output)
		expect(humanCode).toBe(ExitCode.Success)
		expect(human.stdout.text).toContain(JSON.stringify({ message: 'second' }))
		expect(human.stdout.text).not.toContain(JSON.stringify(eventWithLog.log))

		const json = createTestOutput()
		const jsonCode = await command.run(['--json'], json.output)
		expect(jsonCode).toBe(ExitCode.Success)
		expect(JSON.parse(json.stdout.text)).toStrictEqual([eventWithLog])
	})

	test('human table output removes terminal controls from server-controlled fields', async () => {
		const unsafeEvent: Event = {
			...sampleEvent,
			target: '\u001b[31mspoofed',
			log: [{ message: '\u009b31mspoofed' }],
		}
		const command = new ActionsListFailedEventsCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({ listFailedEvents: async () => [unsafeEvent] })),
		)
		const { output, stdout } = createTestOutput()

		const code = await command.run([], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.text).not.toContain('\u001b')
		expect(stdout.text).not.toContain('\u009b')
		expect(stdout.text).toContain('spoofed')
	})
})

describe('actions list-variables', () => {
	const variables: Variable[] = [
		{ name: 'a', value: '1', source: 'DATABASE' },
		{ name: 'b', value: null, source: 'ENVIRONMENT' },
	]

	test('--json prints the raw variable array', async () => {
		const command = new ActionsListVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({ listVariables: async () => variables })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual(variables)
	})

	test('-q prints bare variable names', async () => {
		const command = new ActionsListVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({ listVariables: async () => variables })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['-q'], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.lines).toStrictEqual(['a', 'b'])
	})

	test('names the source and does not invent a value for an environment variable', async () => {
		const command = new ActionsListVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({ listVariables: async () => variables })))
		const { output, stdout } = createTestOutput()

		const code = await command.run([], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.text).toContain('Database')
		expect(stdout.text).toContain('Environment (read-only)')
		expect(stdout.text).toContain('<not readable>')
	})
})

describe('actions set-variables', () => {
	test('reports success as structured data and forwards the parsed pairs', async () => {
		let received: { variables: { name: string; value: string }[]; mode: string } | undefined
		const command = new ActionsSetVariablesCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				setVariables: async (variables, mode) => {
					received = { variables, mode }
					return true
				},
			})),
		)
		const { output, stdout } = createTestOutput()

		const code = await command.run(['a=1', 'b=2', '--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual({ mode: 'MERGE', count: 2 })
		expect(received).toStrictEqual({ variables: [{ name: 'a', value: '1' }, { name: 'b', value: '2' }], mode: 'MERGE' })
	})

	test('-q prints only the number of updated variables', async () => {
		const command = new ActionsSetVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({})))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['a=1', 'b=2', '-q'], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.lines).toStrictEqual(['2'])
	})

	test('an explicit --merge selects MERGE', async () => {
		let receivedMode: string | undefined
		const command = new ActionsSetVariablesCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				setVariables: async (variables, mode) => {
					receivedMode = mode
					return variables.length === 1
				},
			})),
		)
		const { output } = createTestOutput()

		const code = await command.run(['a=1', '--merge'], output)

		expect(code).toBe(ExitCode.Success)
		expect(receivedMode).toBe('MERGE')
	})

	test('rejects every combination of multiple mode flags before calling the API', async () => {
		const combinations: string[][] = [
			['--merge', '--set'],
			['--merge', '--append-only-missing'],
			['--set', '--append-only-missing'],
			['--merge', '--set', '--append-only-missing'],
		]
		for (const flags of combinations) {
			let apiCalls = 0
			const command = new ActionsSetVariablesCommand(
				remoteProjectResolver,
				resolverFor(fakeApi({
					setVariables: async () => {
						apiCalls++
						return true
					},
				})),
			)
			const { output } = createTestOutput()

			try {
				await command.run(['a=1', ...flags], output)
				throw new Error('Expected conflicting modes to fail')
			} catch (error) {
				expect(error).toBeInstanceOf(CliError)
				if (!(error instanceof CliError)) {
					throw error
				}
				expect(error.code).toBe('VARIABLE_MODE_CONFLICT')
				expect(error.details).toStrictEqual({ options: flags })
				expect(JSON.stringify({ message: error.message, details: error.details })).not.toContain('a=1')
			}
			expect(apiCalls).toBe(0)
		}
	})

	test('throws a typed error instead of silently reporting failure', async () => {
		const command = new ActionsSetVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({ setVariables: async () => false })))
		const { output } = createTestOutput()

		const promise = command.run(['a=1'], output)

		await expect(promise).rejects.toBeInstanceOf(CliError)
		await expect(promise).rejects.toMatchObject({ code: 'SET_VARIABLES_FAILED' })
	})

	test('splits on the first = only, keeping the rest of the value verbatim', async () => {
		let received: { name: string; value: string }[] | undefined
		const command = new ActionsSetVariablesCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				setVariables: async variables => {
					received = variables
					return true
				},
			})),
		)
		const { output } = createTestOutput()

		const code = await command.run(['token=abc=def=='], output)

		expect(code).toBe(ExitCode.Success)
		expect(received).toStrictEqual([{ name: 'token', value: 'abc=def==' }])
	})

	test('rejects malformed input without exposing the submitted value in visible error data', async () => {
		const secret = 'DISTINCTIVE_SECRET_49a8f3'
		const command = new ActionsSetVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({})))
		const { output } = createTestOutput()

		try {
			await command.run([secret], output)
			throw new Error('Expected malformed assignment to fail')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (!(error instanceof CliError)) {
				throw error
			}
			expect(error.code).toBe('INVALID_VARIABLE')
			expect(error.details).toStrictEqual({ option: 'variables', position: 1, reason: 'missing separator' })
			const visible = JSON.stringify({ message: error.message, code: error.code, details: error.details })
			expect(visible).not.toContain(secret)

			const human = createTestOutput()
			renderCliError(error, human.output)
			expect(human.stderr.text).not.toContain(secret)

			const json = createTestOutput()
			json.output.setMode('json')
			renderCliError(error, json.output)
			expect(JSON.parse(json.stderr.text).error).toMatchObject({ code: 'INVALID_VARIABLE' })
			expect(json.stderr.text).not.toContain(secret)
		}
	})

	test('rejects an empty variable name without exposing its value', async () => {
		const secret = 'DISTINCTIVE_SECRET_empty_name'
		const command = new ActionsSetVariablesCommand(remoteProjectResolver, resolverFor(fakeApi({})))
		const { output } = createTestOutput()

		try {
			await command.run([`=${secret}`], output)
			throw new Error('Expected empty name to fail')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (!(error instanceof CliError)) {
				throw error
			}
			const visible = JSON.stringify({ message: error.message, code: error.code, details: error.details })
			expect(visible).not.toContain(secret)
		}
	})
})

describe('actions get-event (batch semantics: continue-and-report)', () => {
	test('a single id keeps the pre-migration shape: the bare event, or null', async () => {
		const command = new ActionsGetEventCommand(remoteProjectResolver, resolverFor(fakeApi({ getEvent: async () => sampleEvent })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['evt-1', '--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual(sampleEvent)
	})

	test('a single missing id prints null and exits NotFound without corrupting JSON', async () => {
		const command = new ActionsGetEventCommand(remoteProjectResolver, resolverFor(fakeApi({ getEvent: async () => null })))
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['missing', '--json'], output)

		expect(code).toBe(ExitCode.NotFound)
		expect(JSON.parse(stdout.text)).toBeNull()
		expect(stderr.text).toBe('')
	})

	test('a batch keeps every id, found or not, and exits NotFound if any is missing', async () => {
		const command = new ActionsGetEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({ getEvent: async id => id === 'evt-1' ? sampleEvent : null })),
		)
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['evt-1', 'evt-2', '--json'], output)

		expect(code).toBe(ExitCode.NotFound)
		expect(JSON.parse(stdout.text)).toStrictEqual([
			{ id: 'evt-1', event: sampleEvent },
			{ id: 'evt-2', event: null },
		])
		expect(stderr.text).toBe('')
	})

	test('-q prints the requested ids in order', async () => {
		const command = new ActionsGetEventCommand(remoteProjectResolver, resolverFor(fakeApi({ getEvent: async () => sampleEvent })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['evt-1', 'evt-2', '-q'], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.lines).toStrictEqual(['evt-1', 'evt-2'])
	})

	test('human event output removes terminal controls from server-controlled data', async () => {
		const event: Event = { ...sampleEvent, payload: { value: '\u009b31mspoofed' } }
		const command = new ActionsGetEventCommand(remoteProjectResolver, resolverFor(fakeApi({ getEvent: async () => event })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['evt-1'], output)

		expect(code).toBe(ExitCode.Success)
		expect(stdout.text).not.toContain('\u009b')
		expect(stdout.text).toContain('spoofed')
	})
})

describe('actions retry-event (batch semantics: continue-and-report)', () => {
	test('a single id keeps the unwrapped { id, ok } shape', async () => {
		const command = new ActionsRetryEventCommand(remoteProjectResolver, resolverFor(fakeApi({ retryEvent: async () => true })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['evt-1', '--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual({ id: 'evt-1', ok: true })
	})

	test('a batch retries every id even after one fails, and exits non-zero without dropping the successes', async () => {
		const attempted: string[] = []
		const command = new ActionsRetryEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				retryEvent: async id => {
					attempted.push(id)
					return id !== 'bad'
				},
			})),
		)
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['good', 'bad', 'also-good', '--json'], output)

		// continue-and-report: every id is attempted, not just up to the first failure
		expect(attempted).toStrictEqual(['good', 'bad', 'also-good'])
		expect(code).toBe(ExitCode.InputError)
		expect(JSON.parse(stdout.text)).toStrictEqual([
			{ id: 'good', ok: true },
			{ id: 'bad', ok: false, error: { code: 'ACTION_RETRY_FAILED', retryable: false, exitCode: ExitCode.InputError } },
			{ id: 'also-good', ok: true },
		])
		// JSON mode uses stdout for one result document and the exit code for failure status.
		expect(stderr.text).toBe('')
	})

	test('continues after a transport failure and preserves its meaningful exit code', async () => {
		const attempted: string[] = []
		const command = new ActionsRetryEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				retryEvent: async id => {
					attempted.push(id)
					if (id === 'transient') {
						throw new CliError('Temporary failure', { code: 'ACTIONS_API_SERVER_ERROR', exitCode: ExitCode.Transient })
					}
					return true
				},
			})),
		)
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['first', 'transient', 'last', '--json'], output)

		expect(attempted).toStrictEqual(['first', 'transient', 'last'])
		expect(code).toBe(ExitCode.Transient)
		expect(JSON.parse(stdout.text)).toStrictEqual([
			{ id: 'first', ok: true },
			{ id: 'transient', ok: false, error: { code: 'ACTIONS_API_SERVER_ERROR', retryable: true, exitCode: ExitCode.Transient } },
			{ id: 'last', ok: true },
		])
		expect(stderr.text).toBe('')
	})

	test('human mode identifies failures and removes terminal controls from ids', async () => {
		const command = new ActionsRetryEventCommand(remoteProjectResolver, resolverFor(fakeApi({ retryEvent: async () => false })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['bad\u001b[2Jid'], output)

		expect(code).toBe(ExitCode.InputError)
		expect(stdout.text).toContain('Failed to requeue event bad[2Jid')
		expect(stdout.text).not.toContain('\u001b')
	})

	test('-q prints every attempted id and relies on the exit code for partial failure', async () => {
		const command = new ActionsRetryEventCommand(remoteProjectResolver, resolverFor(fakeApi({ retryEvent: async id => id !== 'bad' })))
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['good', 'bad', '-q'], output)

		expect(code).toBe(ExitCode.InputError)
		expect(stdout.lines).toStrictEqual(['good', 'bad'])
		expect(stderr.text).toBe('')
	})

	test('rejects an empty id before invoking the retry API', async () => {
		let apiCalls = 0
		const command = new ActionsRetryEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				retryEvent: async () => {
					apiCalls++
					return true
				},
			})),
		)
		const { output } = createTestOutput()

		const promise = command.run(['good', '   '], output)

		await expect(promise).rejects.toMatchObject({
			code: 'INVALID_EVENT_ID',
			details: { argument: 'eventIds', position: 2, reason: 'empty' },
		})
		expect(apiCalls).toBe(0)
	})
})

describe('actions stop-event (batch semantics: continue-and-report)', () => {
	test('a single id keeps the unwrapped { id, ok } shape', async () => {
		const command = new ActionsStopEventCommand(remoteProjectResolver, resolverFor(fakeApi({ stopEvent: async () => true })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['evt-1', '--json'], output)

		expect(code).toBe(ExitCode.Success)
		expect(JSON.parse(stdout.text)).toStrictEqual({ id: 'evt-1', ok: true })
	})

	test('a batch stops every id even after one fails, and exits non-zero', async () => {
		const attempted: string[] = []
		const command = new ActionsStopEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				stopEvent: async id => {
					attempted.push(id)
					return id !== 'bad'
				},
			})),
		)
		const { output, stdout, stderr } = createTestOutput()

		const code = await command.run(['good', 'bad', '--json'], output)

		expect(attempted).toStrictEqual(['good', 'bad'])
		expect(code).toBe(ExitCode.NotFound)
		expect(JSON.parse(stdout.text)).toStrictEqual([
			{ id: 'good', ok: true },
			{ id: 'bad', ok: false, error: { code: 'ACTION_STOP_FAILED', retryable: false, exitCode: ExitCode.NotFound } },
		])
		expect(stderr.text).toBe('')
	})

	test('-q prints every attempted id', async () => {
		const command = new ActionsStopEventCommand(remoteProjectResolver, resolverFor(fakeApi({ stopEvent: async id => id !== 'bad' })))
		const { output, stdout } = createTestOutput()

		const code = await command.run(['good', 'bad', '-q'], output)

		expect(code).toBe(ExitCode.NotFound)
		expect(stdout.lines).toStrictEqual(['good', 'bad'])
	})

	test('continues after a thrown failure and reports its transport exit code', async () => {
		const attempted: string[] = []
		const command = new ActionsStopEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				stopEvent: async id => {
					attempted.push(id)
					if (id === 'forbidden') {
						throw new CliError('Denied', { code: 'ACTIONS_API_FORBIDDEN', exitCode: ExitCode.Forbidden })
					}
					return true
				},
			})),
		)
		const { output, stdout } = createTestOutput()

		const code = await command.run(['first', 'forbidden', 'last', '--json'], output)

		expect(attempted).toStrictEqual(['first', 'forbidden', 'last'])
		expect(code).toBe(ExitCode.Forbidden)
		expect(JSON.parse(stdout.text)).toStrictEqual([
			{ id: 'first', ok: true },
			{ id: 'forbidden', ok: false, error: { code: 'ACTIONS_API_FORBIDDEN', retryable: false, exitCode: ExitCode.Forbidden } },
			{ id: 'last', ok: true },
		])
	})

	test('rejects an empty id before invoking the stop API', async () => {
		let apiCalls = 0
		const command = new ActionsStopEventCommand(
			remoteProjectResolver,
			resolverFor(fakeApi({
				stopEvent: async () => {
					apiCalls++
					return true
				},
			})),
		)
		const { output } = createTestOutput()

		const promise = command.run([''], output)

		await expect(promise).rejects.toMatchObject({ code: 'INVALID_EVENT_ID' })
		expect(apiCalls).toBe(0)
	})
})

describe('action mutation batch exit aggregation', () => {
	const domainFailure = { code: 'DOMAIN_FAILURE', retryable: false, exitCode: ExitCode.InputError }

	test('transient failure wins when a domain failure comes first', async () => {
		const batch = await runActionMutationBatch(
			['domain', 'transient'],
			async id => {
				if (id === 'transient') {
					throw new CliError('Temporary', { code: 'ACTIONS_API_SERVER_ERROR', exitCode: ExitCode.Transient })
				}
				return false
			},
			domainFailure,
		)

		expect(batch.exitCode).toBe(ExitCode.Transient)
	})

	test('transient failure wins when a domain failure comes last', async () => {
		const batch = await runActionMutationBatch(
			['transient', 'domain'],
			async id => {
				if (id === 'transient') {
					throw new CliError('Temporary', { code: 'ACTIONS_API_SERVER_ERROR', exitCode: ExitCode.Transient })
				}
				return false
			},
			domainFailure,
		)

		expect(batch.exitCode).toBe(ExitCode.Transient)
	})

	test('unexpected failure wins when every operation fails', async () => {
		const batch = await runActionMutationBatch(
			['domain', 'transient', 'unexpected'],
			async id => {
				if (id === 'transient') {
					throw new CliError('Temporary', { code: 'ACTIONS_API_SERVER_ERROR', exitCode: ExitCode.Transient })
				}
				if (id === 'unexpected') {
					throw new Error('unexpected')
				}
				return false
			},
			domainFailure,
		)

		expect(batch.results.every(result => !result.ok)).toBe(true)
		expect(batch.exitCode).toBe(ExitCode.InternalError)
	})
})

describe('ActionsClient transport errors', () => {
	test('maps HTTP statuses through the shared taxonomy', async () => {
		const scenarios: { status: number; code: string; exitCode: ExitCode }[] = [
			{ status: 403, code: 'ACTIONS_API_FORBIDDEN', exitCode: ExitCode.Forbidden },
			{ status: 404, code: 'ACTIONS_API_NOT_FOUND', exitCode: ExitCode.NotFound },
			{ status: 409, code: 'ACTIONS_API_CONFLICT', exitCode: ExitCode.Conflict },
			{ status: 429, code: 'ACTIONS_API_RATE_LIMITED', exitCode: ExitCode.Transient },
			{ status: 503, code: 'ACTIONS_API_SERVER_ERROR', exitCode: ExitCode.Transient },
		]

		for (const scenario of scenarios) {
			const client = new ActionsClient(
				new GraphQlClient({
					url: 'https://example.com/actions/project',
					fetcher: async () => new Response(JSON.stringify({ errors: [{ message: 'request failed' }] }), { status: scenario.status }),
				}),
			)

			try {
				await client.listVariables()
				throw new Error('Expected request to fail')
			} catch (error) {
				expect(error).toBeInstanceOf(CliError)
				if (!(error instanceof CliError)) {
					throw error
				}
				expect(error.code).toBe(scenario.code)
				expect(error.exitCode).toBe(scenario.exitCode)
			}
		}
	})

	test('maps GraphQL error codes without exposing response payloads', async () => {
		const secret = 'DISTINCTIVE_GRAPHQL_SECRET_45ff'
		const client = new ActionsClient(
			new GraphQlClient({
				url: 'https://example.com/actions/project',
				fetcher: async () =>
					new Response(
						JSON.stringify({
							errors: [{ message: secret, extensions: { code: 'FORBIDDEN' } }],
						}),
						{ status: 200 },
					),
			}),
		)

		try {
			await client.listVariables()
			throw new Error('Expected request to fail')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (!(error instanceof CliError)) {
				throw error
			}
			expect(error.code).toBe('ACTIONS_API_FORBIDDEN')
			expect(error.exitCode).toBe(ExitCode.Forbidden)
			const visible = JSON.stringify({ message: error.message, details: error.details })
			expect(visible).not.toContain(secret)
		}
	})

	test('maps network failures as retryable without leaking request or response secrets', async () => {
		const secret = 'DISTINCTIVE_TRANSPORT_SECRET_12c7'
		const client = new ActionsClient(
			new GraphQlClient({
				url: `https://user:${secret}@example.com/actions/project?token=${secret}`,
				fetcher: async () => {
					throw new Error(`network rejected ${secret}`)
				},
			}),
		)

		try {
			await client.setVariables([{ name: 'token', value: secret }], 'MERGE')
			throw new Error('Expected request to fail')
		} catch (error) {
			expect(error).toBeInstanceOf(CliError)
			if (!(error instanceof CliError)) {
				throw error
			}
			expect(error.code).toBe('ACTIONS_API_UNREACHABLE')
			expect(error.exitCode).toBe(ExitCode.Transient)
			expect(error.retryable).toBe(true)
			const visible = JSON.stringify({
				message: error.message,
				code: error.code,
				details: error.details,
				cause: error.cause instanceof Error ? error.cause.message : error.cause,
			})
			expect(visible).not.toContain(secret)
			expect(visible).not.toContain('mutation(')
			expect(visible).not.toContain('variables')
		}
	})

	test('does not convert a successful domain response with ok false into a transport error', async () => {
		const client = new ActionsClient(
			new GraphQlClient({
				url: 'https://example.com/actions/project',
				fetcher: async () => new Response(JSON.stringify({ data: { retryEvent: { ok: false } } }), { status: 200 }),
			}),
		)

		expect(await client.retryEvent('evt-1')).toBe(false)
	})
})

describe('resolveActionsClient', () => {
	test('throws PROJECT_NOT_DEFINED when no DSN or env vars resolve a project', async () => {
		const promise = resolveActionsClient(new RemoteProjectResolver({}), undefined)

		await expect(promise).rejects.toBeInstanceOf(CliError)
		await expect(promise).rejects.toMatchObject({ code: 'PROJECT_NOT_DEFINED' })
	})

	test('resolves a client from an explicit DSN', async () => {
		const api = await resolveActionsClient(new RemoteProjectResolver({}), 'contember://myproject:mytoken@localhost:4000')
		expect(api).toBeDefined()
	})
})
