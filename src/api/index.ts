import { Router, Request, Response } from "express";

export const apiRouter = (getTVL: () => number) => {
  const router = Router();

  router.get(
    "/getTVL",
    async (_: Request, res: Response): Promise<void> => {
      try {
        res.status(200).end(`${getTVL()}`);
      } catch(err) {
        console.log(err);
        res.status(500).end(err.message);
      }
    });
  return router;
}