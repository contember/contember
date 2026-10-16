import { createLogger, PrettyPrintLoggerHandler } from '../../../../src/index.js'

createLogger(new PrettyPrintLoggerHandler(process.stderr)).info('hello')
