import { describe, expect, test } from 'bun:test'
import { Output, OutputStream } from '@contember/cli-common'
import { TemplateInstaller } from '../../../src/lib/TemplateInstaller.js'
import { WorkspaceCreateCommand, WorkspaceCreateRuntime } from '../../../src/commands/WorkspaceCreateCommand.js'

class CapturingStream implements OutputStream {
	public chunks: string[] = []
	public readonly isTty = false

	public write(text: string): void {
		this.chunks.push(text)
	}

	public get text(): string {
		return this.chunks.join('')
	}
}

const createOutput = () => {
	const stdout = new CapturingStream()
	const stderr = new CapturingStream()
	return { output: new Output({ stdout, stderr }), stdout, stderr }
}

const createCommand = () => {
	const installs: { template: string; targetDir: string; variables: Record<string, string> }[] = []
	const installer: Pick<TemplateInstaller, 'installTemplate'> = {
		installTemplate: async (template, targetDir, variables = {}) => {
			installs.push({ template, targetDir, variables })
		},
	}
	const runtime: WorkspaceCreateRuntime = {
		cwd: () => '/work',
		getPackageVersion: async () => '2.2.0-test',
		detectPackageManager: () => 'bun',
	}
	return { command: new WorkspaceCreateCommand(installer, runtime), installs }
}

describe('WorkspaceCreateCommand output', () => {
	test('--json returns stable created-project data', async () => {
		const { command, installs } = createCommand()
		const { output, stdout, stderr } = createOutput()

		await command.run(['demo', '--template', 'custom', '--json'], output)

		expect(JSON.parse(stdout.text)).toEqual({
			projectName: 'demo',
			projectDirectory: '/work/demo',
			template: 'custom',
			packageManager: 'bun',
		})
		expect(stderr.text).toBe('')
		expect(installs).toEqual([{
			template: 'custom',
			targetDir: '/work/demo',
			variables: { version: '2.2.0-test', projectName: 'demo', packageManager: 'bun' },
		}])
	})

	test('--quiet returns only the created directory', async () => {
		const { command } = createCommand()
		const { output, stdout, stderr } = createOutput()

		await command.run(['demo', '--quiet'], output)

		expect(stdout.text).toBe('/work/demo\n')
		expect(stderr.text).toBe('')
	})

	test('human instructions sanitize project-controlled terminal sequences', async () => {
		const { command } = createCommand()
		const { output, stdout } = createOutput()

		await command.run(['demo\u001b[31m'], output)

		expect(stdout.text).toContain('Contember project successfully created in /work/demo[31m')
		expect(stdout.text).not.toContain('\u001b')
		expect(stdout.text).toContain('bun install')
	})
})
