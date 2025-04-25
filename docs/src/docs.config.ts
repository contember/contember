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
	// 	{
	// 		path: 'path/to/project/admin',
	// 		name: 'Project name',
	// 		description: 'Project description to help AI understand the project',
	// 		excludeFolders: [
	// 			'lib', // You don't want to include the lib folder in the documentation
	// 			'dist',
	// 			'build',
	// 		],
	// 	},
	// ],

	// Component-specific overrides
	// overrides: {
	// 	SelectField: {
	// 		title: 'SelectField (Entity Picker)',
	// 		notes: 'This component is optimized for selecting single related entities (hasOne). Avoid using it for complex data fetching scenarios directly.',
	// 	},
	// },
	excludeComponents: [
		'AlertDialogOverlay',
		'AlertDialogPortal',
		'AvatarImage',
		'BoardCardUI',
		'BoardColumnHandleUI',
		'BoardColumnHeaderUI',
		'BoardColumnUI',
		'BoardDragOverlayUI',
		'BoardItemHandleUI',
		'BoardItemsWrapperUI',
		'BoardNonSortableColumn',
		'BoardNonSortableItems',
		'BoardSortableColumn',
		'BoardSortableItems',
		'BoardWrapperUI',
		'buttonConfig',
		'ColumnDropIndicator',
		'DialogOverlay',
		'DropdownMenuShortcut',
	],
}

export default config
