import { createLogger, TestLoggerHandler } from '@contember/logger'
import { listenOnProcessTermination } from '../../../src/utils/serverTermination'

// Driven by serverTermination.test.ts: prints READY once it listens for signals, JOBS once the jobs run.
listenOnProcessTermination(
	[async () => {
		process.stdout.write('JOBS\n')
	}],
	createLogger(new TestLoggerHandler()),
	{ sigtermDelayMs: Number(process.argv[2]) },
)
setInterval(() => {}, 60_000)
process.stdout.write('READY\n')
