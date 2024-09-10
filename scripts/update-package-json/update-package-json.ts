import * as fs from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const packages = [
	...fs.readdirSync(join(root, 'packages')).map(it => `packages/${it}`),
]

// only if value matches
const scriptsToDelete = {
		"build": "yarn build:js:dev && yarn build:js:prod",
		"build:js:dev": "NODE_ENV=development vite build --mode development",
		"build:js:prod": "vite build --mode production",
		"test": "vitest"
}

const updatePackageJson = (packageJson: any, packageDir: string) => {
	// delete scripts
	for (const [key, value] of Object.entries(scriptsToDelete)) {
		if (packageJson.scripts && packageJson.scripts[key] === value) {
			delete packageJson.scripts[key]
		}
	}

	return packageJson
}

packages.forEach(packageDir => {
	const packageJsonPath = join(root, packageDir, 'package.json')
	if (!fs.existsSync(packageJsonPath)) {
		return
	}
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
	const updatedPackageJson = updatePackageJson(packageJson, packageDir)

	// write
	fs.writeFileSync(packageJsonPath, JSON.stringify(updatedPackageJson, null, '\t') + '\n')
})
