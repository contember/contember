export const rewriteStdoutLine = (message: string) => {
	process.stdout.clearLine(0)
	process.stdout.cursorTo(0)
	process.stdout.write(message)
}

