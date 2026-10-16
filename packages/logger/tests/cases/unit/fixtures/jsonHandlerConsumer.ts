import { createLogger, JsonStreamLoggerHandler } from '../../../../src/index.js'

createLogger(new JsonStreamLoggerHandler(process.stderr)).info('hello')
