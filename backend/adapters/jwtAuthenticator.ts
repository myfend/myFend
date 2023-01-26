import jwt from "jsonwebtoken";
import { APP_SECRET } from "../constants/app";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthenticationUser } from "../controllers/authentication";

export interface UserFinder {
  findUserById(id: string): Promise<AuthenticationUser>;
}

export default class JwtAuthenticator {
  private readonly expiresIn = 60 * 60 * 24;

  private readonly secretOrPrivateKey = APP_SECRET;

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
