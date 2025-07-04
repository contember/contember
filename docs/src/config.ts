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

export function loadConfig(): DocsConfig {
	const configPath = path.resolve(__dirname, './docs.config.js')
	const configPathTs = path.resolve(__dirname, './docs.config.ts')

	let userConfig: Partial<DocsConfig> = {}

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
		try {
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

	const projectRoot = path.resolve(__dirname, '../../')
	mergedConfig.sourceDir = path.resolve(projectRoot, mergedConfig.sourceDir)
	mergedConfig.outputDir = path.resolve(projectRoot, mergedConfig.outputDir)

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
