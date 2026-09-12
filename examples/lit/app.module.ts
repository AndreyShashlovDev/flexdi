import { BehaviorSubject, Observable } from 'rxjs'
import { BasicPresenter, Inject, Injectable, Module } from '../../src/core'

export interface User {
  id: number
  name: string
  email: string
}

export abstract class UserService {
  abstract getUsers(): Observable<User[]>
  abstract addRandomUser(): void
}

@Injectable()
export class UserServiceImpl extends UserService {
  private users = new BehaviorSubject<User[]>([
    {id: 1, name: 'John Doe', email: 'john@example.com'},
    {id: 2, name: 'Jane Smith', email: 'jane@example.com'}
  ])

  public getUsers(): Observable<User[]> {
    return this.users.asObservable()
  }

  public addRandomUser(): void {
    const id = this.users.value.length + 1
    this.users.next([...this.users.value, {id, name: `User ${id}`, email: `user${id}@example.com`}])
  }
}

export abstract class UserPresenter extends BasicPresenter<void> {
  abstract getUsers(): Observable<User[]>
}

@Injectable()
export class UserPresenterImpl extends UserPresenter {
  private filteredUsers = new BehaviorSubject<User[]>([])

  constructor(@Inject(UserService) private readonly userService: UserService) {
    super()
  }

  public ready(): void {
    this.userService.getUsers().subscribe(users => this.filteredUsers.next(users))
  }

  public destroy(): void {
    this.filteredUsers.complete()
  }

  public getUsers(): Observable<User[]> {
    return this.filteredUsers.asObservable()
  }
}

@Module({
  providers: [
    {provide: UserService, useClass: UserServiceImpl},
    {provide: UserPresenter, useClass: UserPresenterImpl}
  ],
  exports: [UserService, UserPresenter]
})
export class AppModule {}
