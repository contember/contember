import sass from 'sass'
import Fiber from 'fibers'
import path from 'path'
import fs from 'fs'

sass.render(
	{
		file: path.join(process.cwd(), '/src/index.sass'),
		importer: (url /*, prev */) => {
			if (url.startsWith('~')) {
				const path = process.cwd() + '/node_modules/' + url.slice(1)

				return {
					file: path,
				}
			}
			return {
				file: url,
			}
		},
		outFile: path.join(process.cwd(), '/dist/style.css'),
		sourceMap: true,
		fiber: Fiber,
	},
	(err, result) => {
		if (err) {
			throw err
		}
		fs.writeFileSync(path.join(process.cwd(), '/dist/style.css'), result.css, function(err) {
			if (err) {
				throw err
			}
		})
		fs.writeFileSync(path.join(process.cwd(), '/dist/style.css.map'), result.map.toString(), function(err) {
			if (err) {
				throw err
			}
		})
	},
)
