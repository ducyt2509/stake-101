import { NextFunction, Request, Response } from 'express';
import StakeService from '../services/stake.service';

export default class StakeController {
  public stakeService = new StakeService();

  public getTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { userAddress } = req.params;

      console.log('userAddress', userAddress);

      let { index, size, sort, ...filters } = req.query;
      const [sortField, sortOrder] = sort
        ? String(sort).split(':')
        : ['timestamp', 'desc'];

      const limit = parseInt(String(size)) || 10;
      const page = parseInt(String(index)) || 1;
      const query = filters ? { ...filters, userAddress } : { userAddress };

      const transactions = await this.stakeService.getTransactions({
        limit,
        page,
        query,
        sort: { [sortField]: sortOrder === 'asc' ? 1 : -1 },
      });

      res.json(transactions);
    } catch (error) {
      next(error);
    }
  };
}
