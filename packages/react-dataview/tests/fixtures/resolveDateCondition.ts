import { Environment } from '@contember/react-binding'
import { createDateFilter } from '../../src/filterTypes/date.js'

// Runs in a child process: Bun cannot switch the time zone back once a test has changed process.env.TZ.
const artifact = JSON.parse(process.argv[2] ?? '{}')
process.stdout.write(JSON.stringify(createDateFilter('createdAt')(artifact, { environment: Environment.create() })))
