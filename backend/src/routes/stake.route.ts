import StakeController from '../controllers/stake.controller';
import { Router } from 'express';
import { Routes } from '../interfaces/routes.interface';

export class StakeRoute implements Routes {
  public path = '/stake';
  public router = Router();
  public stakeController = new StakeController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/:userAddress`,
      this.stakeController.getTransactions,
    );
  }
}
