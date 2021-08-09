import { runAdmin } from '@contember/admin'
import './index.sass'

window.addEventListener('DOMContentLoaded', () => {
	const el = document.querySelector('#contember-config')
	const config = JSON.parse(el?.innerHTML ?? '{}')

	runAdmin({}, { config })
})
