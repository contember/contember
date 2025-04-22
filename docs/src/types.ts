/** Represents the raw data extracted for a single component */
export interface ComponentSourceData {
	componentName: string
	filePath: string
	jsdoc?: string // Raw JSDoc comment block
	props?: Record<string, PropData> // Extracted props from API Extractor or other source
	examples?: string[] // Code examples, potentially extracted from JSDoc or elsewhere
}

export type ApiExtractorReport = any

/** Represents extracted prop information */
export interface PropData {
	name: string
	type: string
	description?: string
	required?: boolean
	defaultValue?: string
}

/** Represents the structured data sent to the AI */
export interface AIPromptData extends Omit<ComponentSourceData, 'filePath'> {
	// Potentially add more structured fields here if needed
	// e.g., separate description, params from JSDoc
}

/** Represents configuration overrides for specific components */
export interface ComponentOverride {
	title?: string
	notes?: string
	// Add other fields that might need overriding
}

/** Structure of the docs.config.ts file */
export interface DocsConfig {
	// Paths for input/output
	sourceDir: string // Directory containing component source files
	apiExtractorReportPath: string // Path to the api.json report
	outputDir: string // Directory to write generated Markdown files

	// Component-specific overrides
	overrides?: Record<string, ComponentOverride>

	// Optional: Glob pattern to find component files
	componentFilePattern?: string

	// Optional: AI configuration (e.g., model name)
	ai?: {
		model?: string
		// other AI params
	}
}
