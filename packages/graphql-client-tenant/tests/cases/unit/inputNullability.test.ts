import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AsyncGenerator } from 'graphql-ts-client-codegen'
import { buildSchema } from 'graphql'

const repositoryRoot = join(import.meta.dir, '../../../../..')

const schema = buildSchema(`
	input NestedInput {
		requiredValue: String!
		optionalValue: String
	}

	input TestInput {
		requiredScalar: String!
		nullableScalar: String
		nullableNested: NestedInput
		nullableList: [String]
		requiredNullableElements: [String]!
		nullableNonNullElements: [String!]
		nonNullList: [String!]!
	}

	type Query {
		value(input: TestInput): String
	}
`)

const typeCheck = async (directory: string, name: string, source: string): Promise<{ readonly exitCode: number; readonly output: string }> => {
	const sourcePath = join(directory, `${name}.ts`)
	await writeFile(sourcePath, source)
	const compiler = Bun.spawn({
		cmd: [
			join(repositoryRoot, 'node_modules/.bin/tsc'),
			'--ignoreConfig',
			'--module',
			'preserve',
			'--moduleResolution',
			'bundler',
			'--noEmit',
			'--skipLibCheck',
			'--strict',
			sourcePath,
		],
		stderr: 'pipe',
		stdout: 'pipe',
	})
	const [exitCode, stderr, stdout] = await Promise.all([
		compiler.exited,
		new Response(compiler.stderr).text(),
		new Response(compiler.stdout).text(),
	])
	return { exitCode, output: `${stdout}${stderr}` }
}

test('generated input types preserve GraphQL nullability', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'contember-codegen-nullability-'))
	const generatedDirectory = join(directory, 'generated')

	try {
		const generator = new AsyncGenerator({
			schemaLoader: async () => schema,
			targetDir: generatedDirectory,
		})
		await generator.generate()

		const input = await readFile(join(generatedDirectory, 'inputs/TestInput.ts'), 'utf8')
		expect(input).toContain('readonly requiredScalar: string;')
		expect(input).toContain('readonly nullableScalar?: string | null;')
		expect(input).toContain('readonly nullableNested?: NestedInput | null;')
		expect(input).toContain('readonly nullableList?: ReadonlyArray<string | null> | null;')
		expect(input).toContain('readonly requiredNullableElements: ReadonlyArray<string | null>;')
		expect(input).toContain('readonly nullableNonNullElements?: ReadonlyArray<string> | null;')
		expect(input).toContain('readonly nonNullList: ReadonlyArray<string>;')

		const validResult = await typeCheck(
			directory,
			'valid',
			`import type { TestInput } from './generated/inputs/TestInput'

const minimal: TestInput = { requiredScalar: 'value', requiredNullableElements: [], nonNullList: [] }
const explicitNulls: TestInput = {
	requiredScalar: 'value',
	nullableScalar: null,
	nullableNested: null,
	nullableList: null,
	requiredNullableElements: [],
	nullableNonNullElements: null,
	nonNullList: [],
}
const nullableListElement: TestInput = {
	requiredScalar: 'value',
	nullableList: ['value', null],
	requiredNullableElements: ['value', null],
	nullableNonNullElements: ['value'],
	nonNullList: ['value'],
}
const nestedWithOptionalOmitted: TestInput = {
	requiredScalar: 'value',
	nullableNested: { requiredValue: 'value' },
	requiredNullableElements: [],
	nonNullList: [],
}
const nestedWithExplicitNull: TestInput = {
	requiredScalar: 'value',
	nullableNested: { requiredValue: 'value', optionalValue: null },
	requiredNullableElements: [],
	nonNullList: [],
}

void minimal
void explicitNulls
void nullableListElement
void nestedWithOptionalOmitted
void nestedWithExplicitNull
`,
		)
		expect(validResult).toEqual({ exitCode: 0, output: '' })

		const invalidResult = await typeCheck(
			directory,
			'invalid',
			`import type { TestInput } from './generated/inputs/TestInput'

export const missingRequiredScalar: TestInput = { requiredNullableElements: [], nonNullList: [] }
export const missingRequiredList: TestInput = { requiredScalar: 'value', nonNullList: [] }
export const nullRequiredScalar: TestInput = { requiredScalar: null, requiredNullableElements: [], nonNullList: [] }
export const nullRequiredList: TestInput = { requiredScalar: 'value', requiredNullableElements: null, nonNullList: [] }
export const nullNonNullList: TestInput = { requiredScalar: 'value', requiredNullableElements: [], nonNullList: null }
export const nullNonNullElement: TestInput = { requiredScalar: 'value', requiredNullableElements: [], nonNullList: [null] }
export const nullNullableNonNullElement: TestInput = {
	requiredScalar: 'value',
	requiredNullableElements: [],
	nullableNonNullElements: [null],
	nonNullList: [],
}
export const nestedMissingRequiredValue: TestInput = {
	requiredScalar: 'value',
	nullableNested: {},
	requiredNullableElements: [],
	nonNullList: [],
}
export const nestedNullRequiredValue: TestInput = {
	requiredScalar: 'value',
	nullableNested: { requiredValue: null },
	requiredNullableElements: [],
	nonNullList: [],
}
`,
		)
		expect(invalidResult.exitCode).not.toBe(0)
		expect(invalidResult.output.match(/error TS/g)).toHaveLength(9)
		expect(invalidResult.output).toContain("Property 'requiredScalar' is missing")
		expect(invalidResult.output).toContain("Property 'requiredNullableElements' is missing")
		expect(invalidResult.output).toContain("Property 'requiredValue' is missing")
		expect(invalidResult.output.match(/Type 'null' is not assignable/g)).toHaveLength(6)
	} finally {
		await rm(directory, { force: true, recursive: true })
	}
}, 30000)
