import sass from 'node-sass'
import path from 'path'
import fs from 'fs'

const result = sass.renderSync({
	file: path.join(process.cwd(), '/src/index.sass'),
	importer: (url /*, prev */) => {
		if (url.startsWith('~')) {
			const path = process.cwd() + '/node_modules/' + url.slice(1)

			return {
				file: path,
			}
		}
	},
})
fs.writeFileSync(path.join(process.cwd(), '/dist/style.css'), result.css, function(err) {
	if (err) {
		throw err
	}
})
