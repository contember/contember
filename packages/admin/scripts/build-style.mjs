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
		},
		fiber: Fiber,
	},
	(err, result) => {
		fs.writeFileSync(path.join(process.cwd(), '/dist/style.css'), result.css, function(err) {
			if (err) {
				throw err
			}
		})
	},
)
