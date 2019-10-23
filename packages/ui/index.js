'use strict'

if (process.env.NODE_ENV === 'production') {
	module.exports = require('./dist/bundle.js')
} else {
	module.exports = require('./dist/src/index.js')
}
