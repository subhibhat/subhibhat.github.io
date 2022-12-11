import React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import App from './app'

import 'bootstrap/scss/bootstrap.scss'
import './app.css'

const container = document.getElementById('root')
const root = ReactDOMClient.createRoot(container)

root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)