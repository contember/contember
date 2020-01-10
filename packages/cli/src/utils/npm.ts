import { runCommand } from './commands'

export const getTarball = async (packageRef: string): Promise<string> => {
	const commandOut = await runCommand('npm', ['view', packageRef, 'dist.tarball'], { cwd: process.cwd() }).output
	const tarBalls = commandOut.trim().split('\n')
	if (tarBalls.length === 1) {
		return tarBalls[0]
	}
	const latest = tarBalls[tarBalls.length - 1]
	const [, tarball] = latest.split(' ', 2)
	return tarball.substring(1, tarball.length - 1)
}
