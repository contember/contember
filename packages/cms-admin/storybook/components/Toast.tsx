import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { Toaster } from '../../src/components/ui/Toaster'
import { DummyAdmin } from '../DummyAdmin'
import { ToastType } from '../../src/state/toasts'

storiesOf('Toaster', module).add('simple', () => (
	<DummyAdmin
		toasts={[
			{ message: 'Success', type: ToastType.Success },
			{ message: 'Warning', type: ToastType.Warning },
			{ message: 'Fail', type: ToastType.Error },
			{ message: 'Info', type: ToastType.Info }
		]}
	>
		<Toaster />
	</DummyAdmin>
))
