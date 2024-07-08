import { Gauge, Metric, Registry } from 'prom-client'

export const createContemberEngineInfoMetric = ({ version = 'unknown' }: {version?: string}): Metric<string> => {
	const contemberEngineInfo = new Gauge({
		help: 'Contember engine info',
		name: 'contember_info',
		labelNames: ['version'],
	})
	contemberEngineInfo.set({ version }, 1)
	return contemberEngineInfo
}
