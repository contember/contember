import { DocsConfig } from './types'

const config: DocsConfig = {
	sourceDir: './packages/react-ui-lib/src',
	contextDir: '../packages/playground/admin',
	componentFilePattern: '**/*.tsx',
	outputDir: './docs/docs/reference/interface/ui-components',
	ai: {
		model: 'o3',
	},
	externalProjects: [
		{
			path: '../../../contember-external/fabis/admin',
			name: 'Learning Platform',
			description: 'A learning platform built with Contember with a lot of features, including user management, course creation, and content organization.',
			excludeFolders: [
				'lib',
				'dist',
				'build',
			],
		},
		{
			path: '../../../108agency/mapeditor/admin',
			name: '108 Agency CRM and CMS',
			description: 'Content management system for a websites and a CRM',
			excludeFolders: [
				'lib',
				'dist',
				'build',
			],
		},
	],

	// Component-specific overrides
	// overrides: {
	// 	SelectField: {
	// 		title: 'SelectField (Entity Picker)',
	// 		notes: 'This component is optimized for selecting single related entities (hasOne). Avoid using it for complex data fetching scenarios directly.',
	// 	},
	// },
}

export default config
