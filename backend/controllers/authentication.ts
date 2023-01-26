import { Request, RequestHandler, Response, Router } from "express";
import Encrypter from "../adapters/encrypter";
import { StatusCodes } from "http-status-codes";
import JwtAuthenticator from "../adapters/jwtAuthenticator";

export interface AuthDb {
  findUserByEmailOrPhone(query: {
    email?: string;
    phone?: string;
  }): Promise<AuthenticationUser>;
}

export default class AuthenticationController {
  private db: AuthDb;

  private encrypter: Encrypter;

  private authenticator: JwtAuthenticator;

  private router = Router();

  constructor(
    db: AuthDb,
    encrypter: Encrypter,
    authenticator: JwtAuthenticator
  ) {
    this.db = db;
    this.encrypter = encrypter;
    this.authenticator = authenticator;
  }

  registerRoute(): Router {
    this.router.post("/login", this.login());
    this.router.get("/authentication/show", this.show());

    return this.router;
  }

  private login(): RequestHandler {
    return async (req: Request, res: Response) => {
      const input: LoginInput = req.body;
      const user = await this.db.findUserByEmailOrPhone({
        email: input.email,
      });

      if (
        !(await this.encrypter.compare(input.password, user.password as string))
      ) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Unauthorized" });
      }

      const token = await this.authenticator.loginUsingId(user.id);

      return res.status(StatusCodes.OK).json({
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          type: user.type,
        },
        token,
      });
    };
  }

  private show(): RequestHandler {
    return async (req: Request, res: Response) => {
      if (!req.user)
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "UNAUTHORIZED" });

      const user = req.user;
      return res.status(StatusCodes.OK).json({
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        type: user.type,
      });
    };
  }
}

type LoginInput = { email: string; phone: string; password: string };

export interface AuthenticationUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  type: string;
}
