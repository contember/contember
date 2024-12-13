import {CompilerState, Extractor, ExtractorConfig} from '@microsoft/api-extractor'
import * as path from 'path'
import * as fs from 'fs'

const files = await fs.promises.readdir('./build/api')
const packageNames = files.map(it => it.replace(/\.api\.md$/, ''))

const config = ExtractorConfig.loadFile('./build/api-extractor.json')
const baseConfig = ExtractorConfig.prepare({
	configObject: config,
	projectFolderLookupToken: path.resolve('./'),
	configObjectFullPath: path.resolve('./build/api-extractor.json'),
	packageJsonFullPath: path.resolve(`./package.json`),
})

const configs = packageNames.map(pckg => ExtractorConfig.prepare({
	configObject: config,
	projectFolderLookupToken: path.resolve('./packages/' + pckg),
	configObjectFullPath: path.resolve('./build/api-extractor.json'),
	packageJsonFullPath: path.resolve(`./packages/${pckg}/package.json`),
}))
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
