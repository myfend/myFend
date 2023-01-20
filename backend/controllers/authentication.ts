import { Request, RequestHandler, Response, Router } from "express";
import { Lender } from "./lender";
import Encrypter from "../adapters/encrypter";
import { StatusCodes } from "http-status-codes";
import JwtAuthenticator from "../adapters/jwtAuthenticator";

export interface AuthDb {
  findUserByEmailOrPhone(query: {
    email?: string;
    phone?: string;
  }): Promise<Lender>;
}

export default class AuthenticationController {
  private db: AuthDb;

  private encrypter: Encrypter;

  private authenticator: JwtAuthenticator;

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
    const router = Router();
    router.post("/login", this.login());

    return router;
  }

  private login(): RequestHandler {
    return async (req: Request, res: Response) => {
      const input: LoginInput = req.body;
      const lender = await this.db.findUserByEmailOrPhone({
        email: input.email,
      });

      if (
        !(await this.encrypter.compare(
          input.password,
          lender.password as string
        ))
      ) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Unauthorized" });
      }

      const token = await this.authenticator.loginUsingId(lender.id);

      return res.status(StatusCodes.OK).json({
        user: {
          id: lender.id,
          firstname: lender.firstname,
          lastname: lender.lastname,
          email: lender.email,
          phone: lender.phone,
          wallet: lender.wallet,
        },
        token,
      });
    };
  }
}

type LoginInput = { email: string; phone: string; password: string };
