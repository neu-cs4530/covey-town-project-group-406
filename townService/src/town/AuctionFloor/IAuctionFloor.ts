import Player from '../../lib/Player';
import { AuctionFloorModel } from '../../types/CoveyTownSocket';
/*
  Represents an auction floor component where users can go and bid on artwork
  Can be created by a player or the auction house itself
*/
export default interface IAuctionFloor {
  /**
   * Starts the auction, decreasing the time left
   * until the counter hits zero
   */
  startAuction(): void;

  /**
   * Returns a model representation of the Auction Floor
   * To be sent to the frontend
   */
  toModel(): AuctionFloorModel;
}

export type Status = 'IN_PROGRESS' | 'WAITING_TO_START' | 'ENDED';
export type Bid = { player: Player | undefined; bid: number };
