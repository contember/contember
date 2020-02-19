import Layout from './Layout.mustache'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		you have been invited to contribute on project {{project}}. <br>
		Since you already have an account, just login with your e-mail and password.
	</p>
	<table>
		<tr>
			<th>E-mail:</th>
			<td>{{email}}</td>
		</tr>
	</table>
`)
