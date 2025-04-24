import { DocsConfig } from './types'

const config: DocsConfig = {
	sourceDir: './packages/react-ui-lib/src',
	contextDir: '../packages/playground/admin',
	componentFilePattern: '**/*.tsx',
	outputDir: './docs/docs/reference/interface/ui-components',
	ai: {
		model: 'o3',
	},
	// externalProjects: [
	//   {
	//     path: 'path/to/external/admin/dir',
	//     name: 'Name of the project',
	//     description: 'Description of the project. This can help AI to understand the context and provide more accurate suggestions.',
	//   },
	// ],

	// Component-specific overrides
	// overrides: {
	// 	SelectField: {
	// 		title: 'SelectField (Entity Picker)',
	// 		notes: 'This component is optimized for selecting single related entities (hasOne). Avoid using it for complex data fetching scenarios directly.',
	// 	},
	// },
}

export default config
