import * as path from 'path'
import * as fs from 'fs'
import type { DocsConfig } from './types'

const DEFAULT_CONFIG: Partial<DocsConfig> = {
	componentFilePattern: '**/*.{ts,tsx,js,jsx}', // Default pattern looks for common component extensions
	outputDir: './generated-docs', // Default output directory
	ai: {
		model: 'gpt-3.5-turbo', // Default AI model
	},
	overrides: {},
}

/**
	* Loads the configuration from `docs.config.ts` located in the parent directory
	* relative to this script file, merges it with defaults, and performs validation.
	*
	* Assumes the script is run from the `docs-generator` directory or its parent.
	*/
export function loadConfig(): DocsConfig {
	// Determine the expected path to docs.config.ts
	// This assumes docs.config.ts is one level up from the 'src' directory.
	// Adjust if your build process places files differently.
	const configPath = path.resolve(__dirname, './docs.config.js') // Look for compiled JS version
	const configPathTs = path.resolve(__dirname, './docs.config.ts') // Or TS version if using ts-node

	let userConfig: Partial<DocsConfig> = {}

	// Try loading the compiled JS config first, then TS (for ts-node execution)
	if (fs.existsSync(configPath)) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const configModule = require(configPath)
			userConfig = configModule.default || configModule
			// eslint-disable-next-line no-console
			console.log(`Loaded configuration from ${configPath}`)
		} catch (error) {
			console.error(`Error loading configuration from ${configPath}:`, error)
			// Decide if you want to throw or continue with defaults
		}
	} else if (fs.existsSync(configPathTs)) {
		// This branch primarily works when running directly with ts-node
		// If compiling first, the .ts file might not be available at runtime
		try {
			// Dynamically importing TS might require specific ts-node setup or flags.
			// Using require might work if ts-node/register is used.
			// For simplicity, let's stick to requiring, assuming ts-node handles it.
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const configModule = require(configPathTs)
			userConfig = configModule.default || configModule
			// eslint-disable-next-line no-console
			console.log(`Loaded configuration from ${configPathTs} (using ts-node)`)
		} catch (error) {
			console.error(`Error loading configuration from ${configPathTs}:`, error)
			// Decide if you want to throw or continue with defaults
		}
	} else {
		console.warn(`Configuration file not found at ${configPath} or ${configPathTs}. Using default values.`)
	}

	// Merge user config with defaults
	const mergedConfig: DocsConfig = {
		...DEFAULT_CONFIG,
		...userConfig,
		// Deep merge AI config if necessary
		ai: {
			...DEFAULT_CONFIG.ai,
			...userConfig.ai,
		},
		// Ensure overrides is always an object
		overrides: {
			...DEFAULT_CONFIG.overrides,
			...userConfig.overrides,
		},
	} as DocsConfig // Cast needed because of partial merging initially

	if (!mergedConfig.sourceDir) {
		throw new Error('Configuration error: `sourceDir` is required in docs.config.ts')
	}
	if (!mergedConfig.apiExtractorReportPath) {
		throw new Error('Configuration error: `apiExtractorReportPath` is required in docs.config.ts')
	}

	// Resolve paths relative to the presumed project root (parent of docs-generator)
	// This makes paths in config relative to the project, not the script location.
	const projectRoot = path.resolve(__dirname, '../../') // Assumes docs-generator is in the project root
	mergedConfig.sourceDir = path.resolve(projectRoot, mergedConfig.sourceDir)
	mergedConfig.apiExtractorReportPath = path.resolve(projectRoot, mergedConfig.apiExtractorReportPath)
	mergedConfig.outputDir = path.resolve(projectRoot, 'docs-generator', mergedConfig.outputDir) // Output relative to docs-generator unless specified differently

	// Ensure output directory exists
	try {
		if (!fs.existsSync(mergedConfig.outputDir)) {
			fs.mkdirSync(mergedConfig.outputDir, { recursive: true })
			// eslint-disable-next-line no-console
			console.log(`Created output directory: ${mergedConfig.outputDir}`)
		}
	} catch (error) {
		console.error(`Error creating output directory ${mergedConfig.outputDir}:`, error)
		throw error // Re-throw as this is critical
	}

	return mergedConfig
}
