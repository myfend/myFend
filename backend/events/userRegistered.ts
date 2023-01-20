export default class UserRegistered {
  private user: UserRegisteredData;

  constructor(user: UserRegisteredData) {
    this.user = user;
  }
}

export type UserRegisteredData = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
};
