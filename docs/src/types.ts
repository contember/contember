export interface ComponentSourceData {
	componentName: string
	filePath: string
	jsdoc?: string
	props?: Record<string, PropData>
	examples?: string[]
	originalExamplesCount?: number
	links?: string[]
	imports?: string[]
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

export interface DocsConfig {
	sourceDir: string
	contextDir: string
	outputDir: string
	overrides?: Record<string, ComponentOverride>
	componentFilePattern?: string
	ai?: {
		model?: string
	}
}
