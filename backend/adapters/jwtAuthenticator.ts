import jwt from "jsonwebtoken";
import { ENCRYPTION_SECRET } from "../constants/encryption";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthenticationUser } from "../controllers/authentication";
import MongoAuthDB from "./mongoAuthDB";

export interface UserFinder {
  findUserById(id: string): Promise<AuthenticationUser>;
}

export default class JwtAuthenticator {
  private readonly expiresIn = 60 * 60 * 24;

  private readonly secretOrPrivateKey = ENCRYPTION_SECRET;

  async loginUsingId(id: string) {
    return jwt.sign(
      {
        data: id,
      },
      this.secretOrPrivateKey,
      { expiresIn: this.expiresIn }
    );
  }

  async verify(token: string) {
    // @ts-ignore
    return jwt.verify(token, this.secretOrPrivateKey).data;
  }
}

function jwtMiddleware(db: UserFinder) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers?.authorization;
    if (!authorization) {
      return next();
    }
    const split: string[] = authorization.split(" ");
    try {
      const userID = await new JwtAuthenticator().verify(split[1]);
      req.user = await db.findUserById(userID);

      return next();
    } catch (err) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: err });
    }
  };
}

export class JwtAuthMiddleware {
  readonly db: UserFinder = new MongoAuthDB();

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const authorization = req.headers?.authorization;
      if (!authorization) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "UNAUTHORIZED" });
      }
      const split: string[] = authorization.split(" ");
      try {
        const userID = await new JwtAuthenticator().verify(split[1]);
        req.user = await this.db.findUserById(userID);

        return next();
      } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: err });
      }
    };
  }
}
