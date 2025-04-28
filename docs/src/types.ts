export type RegenerationReason = {
	isUpdate: boolean

	// Source examples
	sourceExamplesCount: number
	previousSourceCount: number
	sourceExamplesChanged: boolean

	// Playground examples
	playgroundExamplesCount: number
	previousPlaygroundCount: number
	playgroundExamplesChanged: boolean

	// External project examples
	externalExamplesCount: number
	previousExternalCount: number
	externalExamplesChanged: boolean

	// Import examples
	importsCount: number
	previousImportsCount: number
	importsChanged: boolean

	// Totals
	totalExamplesCount: number
	previousTotalCount: number

	// Flags
	hasNewImports: boolean
	hasNewExternalExamples: boolean
}

export interface ExampleSourceInfo {
	source: 'jsdoc' | 'playground' | 'external'
	projectName?: string
	filePath?: string
}

export interface ComponentSourceData {
	componentName: string
	filePath: string
	jsdoc?: string
	props?: Record<string, PropData>
	examples?: string[]
	exampleSources?: ExampleSourceInfo[]
	originalExamplesCount?: number
	playgroundExamplesCount?: number
	externalProjectExamplesCount?: number
	previousDocContent?: string
	links?: string[]
	imports?: string[]
	importSources?: { source: string; path?: string }[]
	regenerationReason?: RegenerationReason
}

export interface PropData {
	name: string
	type: string
	description?: string
	required?: boolean
	defaultValue?: string
}

export interface AIPromptData extends Omit<ComponentSourceData, 'filePath'> {
	// Potentially add more structured fields here if needed
	// e.g., separate description, params from JSDoc
}

export interface ComponentOverride {
	title?: string
	notes?: string
}

export interface ExternalProject {
	path: string
	name: string
	description?: string
	excludeFolders?: string[]  // List of folder names or patterns to exclude from search
}

export interface DocsConfig {
	sourceDir: string
	contextDir: string
	outputDir: string
	overrides?: Record<string, ComponentOverride>
	componentFilePattern?: string
	externalProjects?: ExternalProject[]
	excludeComponents?: string[]
	ai?: {
		model?: string
	}
}
