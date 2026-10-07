import { connect } from 'node:net'
import { PgClient } from './PgClient.js'

const CANCEL_REQUEST_CODE = 80877102
const CANCEL_REQUEST_TIMEOUT_MS = 5000

/**
 * Asks the server to cancel the statement the client is running, with a protocol CancelRequest on a separate socket.
 * Closing the client's own socket does not stop a statement that has not sent a row yet.
 */
export const cancelRunningStatement = async ({ host, port, processID, secretKey }: PgClient): Promise<void> => {
	if (processID === null || secretKey === null) {
		return
	}
	const message = Buffer.alloc(16)
	message.writeInt32BE(16, 0)
	message.writeInt32BE(CANCEL_REQUEST_CODE, 4)
	message.writeInt32BE(processID, 8)
	message.writeInt32BE(secretKey, 12)

	const socket = host.startsWith('/') ? connect(`${host}/.s.PGSQL.${port}`) : connect(port, host)
	await new Promise<void>((resolve, reject) => {
		socket.setTimeout(CANCEL_REQUEST_TIMEOUT_MS, () => {
			socket.destroy(new Error(`PostgreSQL cancel request timed out after ${CANCEL_REQUEST_TIMEOUT_MS} ms`))
		})
		socket.once('error', reject)
		socket.once('close', hadError => {
			if (!hadError) {
				resolve()
			}
		})
		socket.once('connect', () => {
			socket.end(message)
		})
	})
}
