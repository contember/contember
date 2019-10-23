const sass = require('node-sass')
const path = require('path')
const fs = require('fs')
const result = sass.renderSync({
	file: path.join(__dirname, '/../src/index.sass'),
	importer: (url /*, prev */) => {
		if (url.startsWith('~')) {
			const path = process.cwd() + '/node_modules/' + url.slice(1)

			return {
				file: path,
			}
		}
	},
})
fs.writeFileSync(path.join(__dirname, '/../dist/style.css'), result.css, function(err) {
	if (err) {
		throw err
	}
});
