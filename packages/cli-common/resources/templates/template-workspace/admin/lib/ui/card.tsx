import { uic } from '../utils'

export const Card = uic('div', {
	baseClass: 'rounded-xl border bg-card text-card-foreground shadow',
})

export const CardHeader = uic('div', {
	baseClass: 'flex flex-col space-y-1.5 p-6',
})

export const CardTitle = uic('h3', {
	baseClass: 'font-semibold leading-none tracking-tight',
})

export const CardDescription = uic('p', {
	baseClass: 'text-sm text-muted-foreground',
})

export const CardContent = uic('div', {
	baseClass: 'p-6 pt-0 space-y-2 first:pt-6',
})

export const CardFooter = uic('div', {
	baseClass: 'flex items-center p-6 pt-0',
})
