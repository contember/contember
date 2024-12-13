import {CompilerState, Extractor, ExtractorConfig} from '@microsoft/api-extractor'
import * as path from 'path'
import * as fs from 'fs'

const packageNames = (await fs.promises.readdir('./build/api'))
	.map(it => it.replace(/\.api\.md$/, '')).filter(it => it !== 'react-ui-lib' && !it.startsWith('ui-lib-'))
const uiPackages = (await fs.promises.readdir('packages/react-ui-lib/src'))
	.filter(it => !it.includes('.') && it !== 'ui')

const config = ExtractorConfig.loadFile('./build/api-extractor.json')
const baseConfig = ExtractorConfig.prepare({
	configObject: config,
	projectFolderLookupToken: path.resolve('./'),
	configObjectFullPath: path.resolve('./build/api-extractor.json'),
	packageJsonFullPath: path.resolve(`./package.json`),
})

const configs = [
	...packageNames.map(pckg => ExtractorConfig.prepare({
		configObject: config,
		projectFolderLookupToken: path.resolve('./packages/' + pckg),
		configObjectFullPath: path.resolve('./build/api-extractor.json'),
		packageJsonFullPath: path.resolve(`./packages/${pckg}/package.json`),
	})),
	...uiPackages.map(pckg => ExtractorConfig.prepare({
		configObject: {
			...config,
			mainEntryPointFilePath: path.resolve(`packages/react-ui-lib/dist/types/${pckg}/index.d.ts`),
			apiReport: {
				...config.apiReport,
				reportFileName: `ui-lib-${pckg}`,
			}
		},
		projectFolderLookupToken: path.resolve('./packages/react-ui-lib'),
		configObjectFullPath: path.resolve('./build/api-extractor.json'),
		packageJsonFullPath: path.resolve(`./packages/react-ui-lib/package.json`),
	})),
]


const state = CompilerState.create(baseConfig, {
	additionalEntryPoints: configs.map(it => it.mainEntryPointFilePath),
})
const results = []

const isLocal = process.argv.includes('--local')

for (const config of configs) {
	const result = Extractor.invoke(config, {
		localBuild: isLocal,
		compilerState: state,
	})
	if (!result.succeeded) {
		results.push(result)
	}

}
if (results.length > 0) {
	console.error('API extractor failed')
	results.forEach(it => `Errors in ${it.extractorConfig.mainEntryPointFilePath}: ${it.errorCount}`)
	process.exit(1)
} else {
	console.log('API extractor succeeded')
}
