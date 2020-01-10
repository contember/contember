import * as React from 'react'
import { runAdmin } from '@contember/admin'
import './index.sass'
import * as projects from './projects'

window.addEventListener('DOMContentLoaded', function() {
	runAdmin(projects)
})
