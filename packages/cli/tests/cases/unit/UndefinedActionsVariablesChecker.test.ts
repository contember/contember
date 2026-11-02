import { expect, test } from 'bun:test'
import { Actions } from '@contember/schema'
import { Variable } from '../../../src/lib/actions/ActionsClient.js'
import { UndefinedActionsVariablesChecker } from '../../../src/lib/actions/UndefinedActionsVariablesChecker.js'
import { RemoteProject } from '../../../src/lib/project/RemoteProject.js'
import { createTestOutput } from '../../../../cli-common/tests/lib/testOutput.js'

const project = new RemoteProject('blog', 'http://api.test', 'token')

const createActions = (targets: Record<string, Pick<Actions.WebhookTarget, 'url' | 'headers'>>): Actions.Schema => ({
	triggers: {},
	targets: Object.fromEntries(Object.entries(targets).map(([name, target]) => [name, { type: 'webhook', name, ...target }])),
})

const createChecker = (listVariables: () => Promise<Variable[]>) => {
	const io = createTestOutput()
	let requests = 0
	const checker = new UndefinedActionsVariablesChecker(io.output, () => ({
		listVariables: () => {
			requests++
			return listVariables()
		},
	}))
	return { checker, io, requests: () => requests }
}

test('warns about each target with variables the engine does not define', async () => {
	const { checker, io } = createChecker(async () => [
		{ name: 'HOST', value: 'example.com', source: 'DATABASE' },
		{ name: 'TOKEN', value: null, source: 'ENVIRONMENT' },
		{ name: 'EMPTY', value: '', source: 'DATABASE' },
	])

	await checker.check(
		project,
		async () =>
			createActions({
				defined: { url: 'https://{{HOST}}/hook', headers: { Authorization: 'Bearer {{TOKEN}}' } },
				partly: { url: 'https://{{HOST}}/{{MISSING}}', headers: { 'X-Empty': '{{EMPTY}}', 'X-Again': '{{MISSING}}' } },
				plain: { url: 'https://example.com/hook' },
			}),
	)

	expect(io.stderr.lines).toStrictEqual([
		'Warning: webhook target partly references undefined variables: MISSING, EMPTY. '
		+ 'Its events wait until they are set (actions set-variables, or the engine environment).',
	])
})

test('makes no request when no target references a variable', async () => {
	const { checker, io, requests } = createChecker(async () => [])

	await checker.check(project, async () => createActions({ plain: { url: 'https://example.com/hook' } }))

	expect(requests()).toBe(0)
	expect(io.stderr.lines).toStrictEqual([])
})

test('a failed variables request is a warning, not a failure', async () => {
	const { checker, io } = createChecker(async () => {
		throw new Error('Forbidden')
	})

	await checker.check(project, async () => createActions({ target: { url: 'https://{{HOST}}/hook' } }))

	expect(io.stderr.lines).toStrictEqual(['Warning: could not check the variables webhook targets reference: Forbidden'])
})

test('a schema that cannot be built is a warning, not a failure', async () => {
	const { checker, io, requests } = createChecker(async () => [])

	await checker.check(project, async () => {
		throw new Error('Unknown modification')
	})

	expect(requests()).toBe(0)
	expect(io.stderr.lines).toStrictEqual(['Warning: could not check the variables webhook targets reference: Unknown modification'])
})
