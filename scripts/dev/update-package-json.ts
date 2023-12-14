import * as fs from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const packages = [
	...fs.readdirSync(join(root, 'packages')).map(it => `packages/${it}`),
	...fs.readdirSync(join(root, 'ee')).map(it => `ee/${it}`),
]

const updatePackageJson = (packageJson: any, packageDir: string) => {
	// custom code
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
