import { UserType } from "../database/models/user";

export const roles = {
  [UserType.Controller]: ["admin.create"],
};
