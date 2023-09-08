import { MigrationFileLoader } from './MigrationFileLoader'
import { buildJs } from '../esbuild'
import { MigrationParser } from './MigrationParser'
import { MigrationFile } from './MigrationFile'

export class JsLoader implements MigrationFileLoader {
	constructor(
		private readonly migrationParser: MigrationParser,
	) {
	}


	public async load(file: MigrationFile) {
		const code = await buildJs(file.path)
		const fn = new Function(`var module = {}; ((module) => { ${code} })(module); return module`)
		const exports = fn().exports
		if (!('default' in exports)) {
			throw `default export is missing in ${file.path}`
		}
		if (typeof exports.default !== 'function') {
			return this.migrationParser.parse(file, exports.default)
		}

		return exports.default
	}
}
