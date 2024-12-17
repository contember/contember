import * as fs from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const packages = [
	...fs.readdirSync(join(root, 'packages')).map(it => `packages/${it}`),
]



const updatePackageJson = (packageJson: any, packageDir: string) => {

	return {
		...packageJson,
		"exports": {
			".": {
				"import": {
					"types": "./dist/types/index.d.ts",
					"development": "./dist/development/index.js",
					"production": "./dist/production/index.js",
					"typescript": "./src/index.ts",
					"default": "./dist/production/index.js"
				},
				"require": {
					"types": "./dist/types/index.d.ts",
					"development": "./dist/development/index.cjs",
					"production": "./dist/production/index.cjs",
					"typescript": "./src/index.ts",
					"default": "./dist/production/index.cjs"
				}
			}
		},
	}
}

packages.forEach(packageDir => {
	const packageJsonPath = join(root, packageDir, 'package.json')
	if (!fs.existsSync(packageJsonPath)) {
		return
	}
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
	const updatedPackageJson = updatePackageJson(packageJson, packageDir)

	// write
	fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, '  ') + '\n')
})
