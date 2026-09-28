import { mount } from 'svelte';
// self-hosted fonts, so no request goes to Google before the visitor has a say
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/noto-sans-thai/300.css';
import '@fontsource/noto-sans-thai/400.css';
import './app.css';
import App from './App.svelte';

export default mount(App, { target: document.getElementById('app') });
