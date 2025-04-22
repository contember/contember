import { DocsConfig } from './types'

const config: DocsConfig = {
	sourceDir: './packages/react-ui-lib/src/field',
	apiExtractorReportPath: './build/api/ui-lib-field.api.md',

	// Glob pattern to identify component files within sourceDir
	// Optional: Defaults to finding .tsx/.jsx files if not specified.
	// componentFilePattern: '**/*.tsx', // Example: Only find .tsx files

	outputDir: './docs/generated-docs',
	ai: {
		model: 'o3',
		// You might add other AI parameters here, like temperature, max tokens, etc.
	},

	overrides: {
		SelectField: {
			title: 'SelectField (Entity Picker)',
			notes: 'This component is optimized for selecting single related entities (hasOne). Avoid using it for complex data fetching scenarios directly.',
		},
		// Add other components as needed
	},
}

export default config
