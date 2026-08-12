/**
 * Ends the process with the given exit code without losing buffered output.
 *
 * `process.exit()` terminates immediately and discards whatever `process.stdout` has not yet handed
 * to the OS. Writes to a pipe are asynchronous, so anything past the 64 KB pipe buffer was silently
 * dropped — `contember commands --json | jq` got a truncated document while the same command
 * redirected to a file was complete. Assigning `exitCode` instead lets the runtime exit on its own
 * once the streams have drained, which also covers output written directly through `console.log`.
 */
export const exitProcess = (code: number): void => {
	process.exitCode = code
}
