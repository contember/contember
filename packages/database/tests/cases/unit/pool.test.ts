import { expect, it, beforeAll } from 'vitest'
import { ClientErrorCodes, Pool, PoolLogger } from '../../../src/index.js'
import { Client as PgClient } from 'pg'
import EventEmitter from 'events'

const createPoolLogger = () => {
	const logger: PoolLogger & {messages: string; clear: () => void} = (message, pool) => {
		logger.messages += `${pool.connecting}${pool.active}${pool.idle} ${pool.pending}: ${message}\n`
	}
	logger.messages = '\nCAI P\n'
	logger.clear = () => logger.messages = 'CAI P\n'
	return logger
}

const timeout = async (ms = 1) => await new Promise(resolve => setTimeout(resolve, ms))

beforeAll(() => {
	expect.addSnapshotSerializer({
		test: val => typeof val === 'string',
		print: val => String(val),
	})
})

it('acquires and releases new connection from pool', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
	})
	const connection = await pool.acquire()
	await pool.release(connection)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 0: Releasing a connection.
		001 0: Connection is idle and available.
	`)
})


it('disposes connection when maxIdle is reached', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
		maxIdle: 0,
	})
	const connection = await pool.acquire()
	await pool.release(connection)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 0: Releasing a connection.
		000 0: Too many idle connections, connection disposed.
	`)
})

it('disposes connection after max uses', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
		maxUses: 1,
	})
	const connection = await pool.acquire()
	await pool.release(connection)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 0: Releasing a connection.
		000 0: Not connecting, queue is empty.
		000 0: Connection has reached max age or usage and was disposed.
	`)
})

it('disposes errored connection', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
		maxIdle: 0,
	})
	const connection = await pool.acquire()
	await pool.dispose(connection)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 0: Releasing and disposing a connection.
		000 0: Not connecting, queue is empty.
		000 0: Connection errored and was disposed.
	`)
})


it('time outs when waiting for a connection', async () => {
	const logger = createPoolLogger()
	const clientMock = new PgClientMock()
	clientMock.connections.push(createSuccessfulPromise(5))
	const pool = new Pool(() => clientMock as unknown as PgClient, {
		log: logger,
		acquireTimeoutMs: 2,
	})
	await expect(pool.acquire.bind(pool)).rejects.toThrowError('Failed to acquire a connection')
	await timeout(4)

	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 0: Queued item timed out
		100 0: Connection established
		001 0: Connection is idle and available.
		001 0: Not connecting, queue is empty.
	`)
})


it('acquires idle connection from pool', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
	})
	const connection = await pool.acquire()
	await pool.release(connection)
	logger.clear()
	const connection2 = await pool.acquire()
	await pool.release(connection2)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		010 0: Item fulfilled with an idle connection.
		010 0: Releasing a connection.
		001 0: Connection is idle and available.
	`)
})

it('acquires multiple new connections from pool', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
	})
	const conn1 = await pool.acquire()
	const conn2 = await pool.acquire()
	await pool.release(conn1)
	await pool.release(conn2)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 1: Item added to a queue.
		010 1: Creating a new connection
		110 1: Connection established
		020 0: Queued item fulfilled with new connection.
		020 0: Not connecting, queue is empty.
		020 0: Releasing a connection.
		011 0: Connection is idle and available.
		011 0: Releasing a connection.
		002 0: Connection is idle and available.
	`)
})


it('releases idle connection', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		log: logger,
		idleTimeoutMs: 2,
	})
	const conn1 = await pool.acquire()
	await pool.release(conn1)
	await timeout(4)
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 0: Releasing a connection.
		001 0: Connection is idle and available.
		000 0: Idle connection disposed after timeout.
	`)
})


it('waits for idle connection when pool is full', async () => {
	const logger = createPoolLogger()
	const pool = new Pool(() => new PgClientMock() as unknown as PgClient, {
		maxConnections: 1,
		log: logger,
	})
	const conn1 = await pool.acquire()
	setTimeout(async () => {
		await pool.release(conn1)
	}, 20)
	const conn2 = await pool.acquire()
	await pool.release(conn2)
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
		010 1: Item added to a queue.
		010 1: Not connecting, max connections reached.
		010 1: Releasing a connection.
		010 0: Queued item fulfilled with released connection.
		010 0: Releasing a connection.
		001 0: Connection is idle and available.
	`)
})


it('tries to reconnect on recoverable error', async () => {
	const logger = createPoolLogger()
	const pgClientMock = new PgClientMock()
	pgClientMock.on('error', () => {

	})
	const pool = new Pool(() => pgClientMock as unknown as PgClient, {
		log: logger,
	})
	pgClientMock.connections.push(createRecoverableErrorPromise(), createRecoverableErrorPromise())
	await pool.acquire()
	await timeout()
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection error occurred: too many connection
		100 1: Recoverable error, retrying in a moment.
		000 1: Retrying
		000 1: Creating a new connection
		100 1: Connection error occurred: too many connection
		100 1: Recoverable error, retrying in a moment.
		000 1: Retrying
		000 1: Creating a new connection
		100 1: Connection established
		010 0: Queued item fulfilled with new connection.
		010 0: Not connecting, queue is empty.
	`)
})


it('fails to reconnect on recoverable error', async () => {
	const logger = createPoolLogger()
	const pgClientMock = new PgClientMock()
	pgClientMock.on('error', () => {

	})
	const pool = new Pool(() => pgClientMock as unknown as PgClient, {
		log: logger,
		reconnectIntervalMs: 5,
		acquireTimeoutMs: 10,
	})
	pool.on('error', () => {
	})
	pgClientMock.connections.push(createRecoverableErrorPromise(), createRecoverableErrorPromise())
	await expect(async () => await pool.acquire()).rejects.toThrowError('Failed to acquire a connection. Last error: too many connection')
	await timeout(2)
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection error occurred: too many connection
		100 1: Recoverable error, retrying in a moment.
		000 1: Retrying
		000 1: Creating a new connection
		100 1: Connection error occurred: too many connection
		100 1: Recoverable error, max retries reached.
		000 0: Queued item timed out
	`)
})

it('fails to reconnect on unrecoverable error', async () => {
	const logger = createPoolLogger()
	const pgClientMock = new PgClientMock()
	const pool = new Pool(() => pgClientMock as unknown as PgClient, {
		log: logger,
		acquireTimeoutMs: 3,
	})
	pgClientMock.connections.push(createErrorPromise())
	pool.on('error', () => {

	})
	const poolError = new Promise(resolve => pool.once('error', e => {
		resolve(e)
	}))

	await expect(pool.acquire.bind(pool)).rejects.toThrowError('Failed to acquire a connection')
	await expect(poolError).resolves.toEqual(new Error('my err'))

	await timeout(4)
	expect(logger.messages).toMatchInlineSnapshot(`
		CAI P
		000 1: Item added to a queue.
		000 1: Creating a new connection
		100 1: Connection error occurred: my err
		000 1: Connecting failed, emitting error
		000 0: Queued item timed out
	`)
})



const createSuccessfulPromise = (timeout = 1) => () => new Promise<void>(resolve => {
	setTimeout(resolve, timeout)
})

const createRecoverableErrorPromise = () => () => new Promise<void>((resolve, reject) => {
	setTimeout(() => {
		const err: Error & {code?: string} = new Error('too many connection')
		err.code = ClientErrorCodes.TOO_MANY_CONNECTIONS
		reject(err)
	}, 1)
})

const createErrorPromise = () => () => new Promise<void>((resolve, reject) => {
	setTimeout(() => reject(new Error('my err')), 1)
})

const PgClientMock = class extends EventEmitter {
	public connections: (() => Promise<void>)[] = []

	async connect() {
		const connection = this.connections.shift()
		return connection ? connection() : createSuccessfulPromise()
	}

	async end() {
		return createSuccessfulPromise()
	}
}
