'use strict'

if (process.env.NODE_ENV === 'production') {
	module.exports = require('./dist/bundle.js')
} else {
	;(globalThis || window || {})['__DEV_MODE__'] = true
	module.exports = require('./dist/src/index.js')
}
