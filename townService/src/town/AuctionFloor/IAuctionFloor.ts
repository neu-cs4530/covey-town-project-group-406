import Player from '../../lib/Player';
import { Player as PlayerModel, Artwork } from '../../types/CoveyTownSocket';
/*
  Represents an auction floor component where users can go and bid on artwork
  Can be created by a player or the auction house itself
*/
export default interface IAuctionFloor {
  /**
   * Gives the artwork that is on auction in this
   * floor to the player who's current bid is active
   */
  giveArtworkToPlayer(): void;

  /**
   * Removes the artwork that is on auction from the
   * Player who is auctioning the artwork
   */
  removeArtworkFromPlayer(): void;

  /**
   * Decreases the amount of time left in the auction
   */
  decreaseAuctionTimeLeft(): void;

  /**
   * Starts the auction, decreasing the time left
   * until the counter hits zero
   */
  startAuction(): void;

  /**
   * Function to remove artwork and give artwork where
   * and if necessary when the time left of an auction hits zero
   */
  endAuction(): void;

  /**
   * Returns a model representation of the Auction Floor
   * To be sent to the frontend
   */
  toModel(): AuctionFloorModel;

  /**
   * Emits an event so the auctionhouse knows
   * When to remove the auctionFloor from it's array
   */
  emitAuctionEndEvent(): void;
}

export type Status = 'IN_PROGRESS' | 'WAITING_TO_START' | 'ENDED';
export type Bid = { player: Player | undefined; bid: number };

export type AuctionFloorModel = {
  _id: string;
  _status: Status;
  _artBeingAuctioned: Artwork;
  _timeLeft: number;
  _currentBid: { player: PlayerModel | undefined; bid: number };
  _auctioneer: PlayerModel | undefined;
  _observers: PlayerModel[];
  _bidders: PlayerModel[];
};
