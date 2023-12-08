import { join, relative } from 'node:path'
import { inspect } from 'node:util'
import { access } from 'node:fs/promises'

import { ReactNode } from 'react'
import FastGlob from 'fast-glob'
import micromatch from 'micromatch'

import { Environment, MarkerTreeGenerator } from '@contember/admin'

import { Config, PageConfig } from './config'
import { createEnvironment } from './environment'
import { createNode } from './nodes'
import { createModelForRole } from './schema'

export interface Test {
	testName: string
	path: string
	relativePath: string
	role: string
	exportedAs: string
	export: unknown
	pageConfig: PageConfig
	environment: Environment
	execute: () => void
}



export const getTests = async (config: Config): Promise<Test[]> => {
	let pageBaseDir
	const possibleDirs = config.pagesDir ? [config.pagesDir] : ['pages', 'admin/pages']
	for (const candidateDir of possibleDirs) {
		const tmpBaseDir = join(process.cwd(), candidateDir)
		if (await pathExists(tmpBaseDir)) {
			pageBaseDir = tmpBaseDir
		}
	}
	if (!pageBaseDir) {
		throw new Error(`Pages directory ${possibleDirs.join(' or ')} not found,  please specify "pagesDir" option.`)
	}

	const pagesPattern = join(pageBaseDir, config.include ?? '**/*.tsx')
	const pages = await FastGlob(pagesPattern)
	if (pages.length === 0) {
		throw new Error(`No interface pages found in ${pagesPattern}. You can modify the search pattern using "pagesDir" and "include" options.`)
	}

	const ignored = config.exclude ? Array.isArray(config.exclude)
		? config.exclude
		: [config.exclude]
		: []

	const tests: Test[] = []
	for (const pagePath of pages) {
		const relativePath = relative(pageBaseDir, pagePath)
		if (micromatch.isMatch(relativePath, ignored)) {
			continue
		}

		const exports = await import(pagePath)
		for (const [name, _export] of Object.entries(exports) as any) {
			const testName = `${relativePath}/${name}`
			if (micromatch.isMatch(testName, ignored)) {
				continue
			}
			let pageConfig: PageConfig = {}
			for (const [pattern, itConfig] of Object.entries(config.pages ?? {})) {
				if (micromatch.isMatch(relativePath, pattern) || micromatch.isMatch(testName, pattern)) {
					pageConfig = {
						...itConfig,
						...pageConfig,
					}
				}
			}
			pageConfig = {
				...config,
				...pageConfig,
			}
			for (const role of pageConfig.roles ?? ['admin']) {
				const model = createModelForRole(config.schema, role)
				const environment = createEnvironment({ model, role, pageConfig })
				tests.push({
					testName,
					path: pagePath,
					relativePath,
					exportedAs: name,
					export: _export,
					environment,
					role,
					pageConfig,
					execute: () => {
						const nodes = (pageConfig?.createNode ?? createNode)(_export)
						for (const node of !Array.isArray(nodes) ? [nodes] : nodes) {
							(pageConfig?.testNode ?? testNode)(node, environment, _export)
						}
					},
				})
			}
		}
	}
	return tests
}


export const testNode = (node: ReactNode | undefined, environment: Environment, originalExport: unknown) => {
	if (node === undefined) {
		throw new Error(`Unsupported export: ` + inspect(originalExport))
	}
	new MarkerTreeGenerator(node, environment).generate()
}

const pathExists = async (path: string) => {
	try {
		await access(path)
		return true
	} catch {
		return false
	}
}
