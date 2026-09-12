import { css, html, LitElement } from 'lit'
import { customElement } from 'lit/decorators.js'
import { InjectController, ObservableController, PresenterController } from '../../src/lit'
import { User, UserPresenter, UserService } from './app.module'

@customElement('user-list')
export class UserListElement extends LitElement {
  static styles = css`
    :host { display: block; font-family: sans-serif; }
    button { margin-top: 0.5rem; }
  `

  private readonly presenterCtrl = new PresenterController(this, UserPresenter)
  private readonly usersCtrl = new ObservableController(this, () => this.presenterCtrl.value.getUsers(), [] as User[])
  private readonly userServiceCtrl = new InjectController(this, UserService)

  protected render() {
    if (!this.presenterCtrl.isReady || !this.userServiceCtrl.isReady) {
      return html`<p>Loading...</p>`
    }

    const users = this.usersCtrl.value

    return html`
      <h1>User List</h1>
      <ul>
        ${users.map(user => html`<li>${user.name} (${user.email})</li>`)}
      </ul>
      <button @click=${() => this.userServiceCtrl.value.addRandomUser()}>
        Add user
      </button>
    `
  }
}
