import 'reflect-metadata'
import '../../src/lit'
import './user-list.element'
import { AppModule } from './app.module'

const root = document.getElementById('app')!

const loader = document.createElement('flexdi-root-module-loader') as any
loader.module = AppModule

const loading = document.createElement('p')
loading.slot = 'loading'
loading.textContent = 'Loading...'
loader.appendChild(loading)

const error = document.createElement('p')
error.slot = 'error'
error.textContent = 'Failed to load the app module.'
loader.appendChild(error)

loader.appendChild(document.createElement('user-list'))

root.appendChild(loader)
