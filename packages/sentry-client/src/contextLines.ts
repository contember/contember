import { readFile } from 'node:fs/promises'
import { StackFrame } from './types.js'

// Source lines around each frame, read and cut as @sentry/node 7 did (7 lines each side, long lines snipped).

const maxCachedFiles = 100

/** The most recently used source files, split into lines; `null` for a file that could not be read. */
const fileCache = new Map<string, string[] | null>()

const readLines = async (filename: string): Promise<string[] | null> => {
	const cached = fileCache.get(filename)
	if (cached !== undefined) {
		fileCache.delete(filename)
		fileCache.set(filename, cached)
		return cached
	}
	let lines: string[] | null = null
	try {
		lines = (await readFile(filename, 'utf8')).split('\n')
	} catch {
		// not a file on this machine (node: internals, eval, a deleted file)
	}
	fileCache.set(filename, lines)
	if (fileCache.size > maxCachedFiles) {
		const oldest = fileCache.keys().next()
		if (!oldest.done) {
			fileCache.delete(oldest.value)
		}
	}
	return lines
}

/** Cuts a long line to about 140 characters around `colno`, exactly as @sentry/node 7 did, stray quote included. */
export const snipLine = (line: string, colno: number): string => {
	const length = line.length
	if (length <= 150) {
		return line
	}
	const column = Math.min(colno, length)
	let start = Math.max(column - 60, 0)
	if (start < 5) {
		start = 0
	}
	let end = Math.min(start + 140, length)
	if (end > length - 5) {
		end = length
	}
	if (end === length) {
		start = Math.max(end - 140, 0)
	}
	let snipped = line.slice(start, end)
	if (start > 0) {
		snipped = `'{snip} ${snipped}`
	}
	if (end < length) {
		snipped += ' {snip}'
	}
	return snipped
}

const addContext = (lines: readonly string[], frame: StackFrame, linesOfContext: number): void => {
	if (frame.lineno === undefined) {
		return
	}
	const sourceLine = Math.max(Math.min(lines.length - 1, frame.lineno - 1), 0)
	frame.pre_context = lines.slice(Math.max(0, sourceLine - linesOfContext), sourceLine).map(line => snipLine(line, 0))
	frame.context_line = snipLine(lines[Math.min(lines.length - 1, sourceLine)], frame.colno ?? 0)
	frame.post_context = lines.slice(Math.min(sourceLine + 1, lines.length), sourceLine + 1 + linesOfContext).map(line => snipLine(line, 0))
}

export const addContextLines = async (frames: readonly StackFrame[], linesOfContext: number): Promise<void> => {
	if (linesOfContext <= 0) {
		return
	}
	for (const frame of frames) {
		if (frame.filename === undefined || frame.context_line !== undefined) {
			continue
		}
		const lines = await readLines(frame.filename)
		if (lines !== null) {
			addContext(lines, frame, linesOfContext)
		}
	}
}
