import { timeStamp } from 'console';
import { Pagination } from '../interfaces/common.interface';
import { IStake } from '../interfaces/stake.interface';
import Stake from '../model/Stake';
import { HttpException } from '../utils/HttpException';
import { paginate } from '../utils/paginate';

class StakeService {
  private stakeCollection = new Stake();

  public getTransactions = async ({
    limit,
    page,
    query,
    sort = { timestamp: -1 },
  }: {
    limit: number;
    page: number;
    query: Record<string, any>;
    sort?: Record<string, any>;
  }) => {
    try {
      const getAllTransactionTypes = await paginate<Pagination<IStake>>({
        model: Stake,
        filter: query,
        page: page,
        limit: limit,
        sort: sort,
      });
      return getAllTransactionTypes;
    } catch (error) {
      throw new HttpException(500, 'Internal server error');
    }
  };
}

export default StakeService;
