import { PlaygroundExampleFinder } from './playground-parser'
import { ExampleSourceInfo, ExternalProject } from './types'

export class ExternalProjectExampleFinder extends PlaygroundExampleFinder {
	public async findExternalExamples(
		componentName: string,
		externalProjects: ExternalProject[],
	): Promise<{ examples: string[]; sourcesInfo: ExampleSourceInfo[]; imports: string[]; importSources: { source: string; path?: string }[] }> {
		const examplesByProject = new Map<string, string[]>()
		const importsByProject = new Map<string, string[]>()

		for (const project of externalProjects) {
			try {
				// eslint-disable-next-line no-console
				console.log(`Searching for ${componentName} usage in external project: ${project.name} (${project.path})...`)

				const projectExamples = await super.findComponentExamples(
					componentName,
					project.path,
					project.excludeFolders,
				)

				if (projectExamples.length > 0) {
					// eslint-disable-next-line no-console
					console.log(` -> Found ${projectExamples.length} usage examples in ${project.name}`)
					examplesByProject.set(project.name, projectExamples)
				}

				const projectImports = await super.findComponentImports(
					componentName,
					project.path,
					project.excludeFolders,
				)
				if (projectImports.length > 0) {
					// eslint-disable-next-line no-console
					console.log(` -> Found ${projectImports.length} import examples in ${project.name}`)
					importsByProject.set(project.name, projectImports)
				}

			} catch (error) {
				console.error(`Error finding examples in external project ${project.name}:`, error)
			}
		}

		const finalExamples: string[] = []
		const finalSourcesInfo: ExampleSourceInfo[] = []
		const exampleProjectNames = Array.from(examplesByProject.keys())
		let exampleIdx = 0
		const maxExamples = 10
		while (finalExamples.length < maxExamples) {
			let addedExampleInRound = false
			for (const projectName of exampleProjectNames) {
				const projectExamples = examplesByProject.get(projectName)!
				if (exampleIdx < projectExamples.length) {
					finalExamples.push(projectExamples[exampleIdx])
					finalSourcesInfo.push({
						source: 'external',
						projectName: projectName,
					})
					addedExampleInRound = true
					if (finalExamples.length >= maxExamples) break
				}
			}
			if (!addedExampleInRound) break
			exampleIdx++
		}

		const finalImports: string[] = []
		const finalImportSources: { source: string; path?: string }[] = []
		const importProjectNames = Array.from(importsByProject.keys())
		let importIdx = 0
		const maxImports = 5
		while (finalImports.length < maxImports) {
			let addedImportInRound = false
			for (const projectName of importProjectNames) {
				const projectImports = importsByProject.get(projectName)!
				if (importIdx < projectImports.length) {
					finalImports.push(projectImports[importIdx])
					finalImportSources.push({
						source: projectName,
					})
					addedImportInRound = true
					if (finalImports.length >= maxImports) break
				}
			}
			if (!addedImportInRound) break
			importIdx++
		}

		return {
			examples: finalExamples,
			sourcesInfo: finalSourcesInfo,
			imports: finalImports,
			importSources: finalImportSources,
		}
	}

	public async directoryExists(dirPath: string): Promise<boolean> {
		try {
			const file = Bun.file(dirPath)
			return await file.exists()
		} catch (error: any) {
			if (error?.code !== 'ENOENT') {
				console.error(`Error checking directory existence: ${dirPath}`, error)
			}
			return false
		}
	}
}
