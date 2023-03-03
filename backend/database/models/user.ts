import { model, Schema, Types } from "mongoose";
import { Lender } from "../../controllers/lender";
import { Controller } from "../../console/controller";
import { AuthenticationUser } from "../../controllers/authentication";

export enum UserType {
  Lender = "lender",
  Administrator = "administrator",
  Controller = "controller",
}

interface UserInterface {
  firstname: string;
  lastname: string;
  fullName: string;
  email: string;
  phone: string;
  wallet?: { address: string; balance: number; available: number };
  password: string;
  projectContributed: Types.ObjectId[];
  type: UserType;
  toUser(): AuthenticationUser;
  toLender(): Lender;
  toController(): Controller;
}

const schema = new Schema<UserInterface>(
  {
    firstname: String,
    lastname: String,
    email: { type: String, unique: true },
    phone: { type: String, unique: true },
    password: String,
    projectContributed: [{ type: Types.ObjectId, ref: "Invoice" }],
    wallet: { address: String, balance: Number },
    type: {
      type: String,
      enum: Object.values(UserType).filter((x) => typeof x === "string"),
    },
  },
  {
    methods: {
      toLender(): Lender {
        if (this.type !== UserType.Lender)
          throw new Error("user type not lender");
        return {
          email: this.email,
          firstname: this.firstname,
          id: this._id.toString(),
          lastname: this.lastname,
          fullName: this.fullName,
          password: this.password,
          phone: this.phone,
          wallet: this.wallet || { address: "", balance: 0, available: 0 },
        };
      },
      toUser(): AuthenticationUser {
        return {
          email: this.email,
          firstname: this.firstname,
          fullName: this.fullName,
          id: this._id.toString(),
          lastname: this.lastname,
          password: this.password,
          phone: this.phone,
          type: this.type,
        };
      },
      toController(): Controller {
        if (this.type !== UserType.Controller)
          throw new Error("user type not controller");
        return {
          email: this.email,
          fullName: this.fullName,
          firstname: this.firstname,
          id: this._id.toString(),
          lastname: this.lastname,
          password: this.password,
          phone: this.phone,
        };
      },
    },
    timestamps: true,
  }
);

schema.virtual("fullName").get(function () {
  return [this.firstname, this.lastname].join(" ");
});
const User = model<UserInterface>("User", schema);

export default User;
