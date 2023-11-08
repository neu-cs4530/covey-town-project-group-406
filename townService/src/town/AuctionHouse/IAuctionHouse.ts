import { InteractableType, Artwork, Interactable } from '../../types/CoveyTownSocket';
import Player from '../../lib/Player';
import { AuctionFloorModel } from '../AuctionFloor/IAuctionFloor';

/**
 * Interface representing an entire auction house which stores many auction floors
 * This is the main interactable component we are implementing for covey.town
 */
export default interface IAuctionHouse {
  /**
   * This method sets the artworks in the auction house that are available to go on auction
   * @param artworks the artworks to set
   */
  addArtworksToAuctionHouse(artworks: Artwork[]): void;
  /**
   * Creates a new auction floor and adds it to the
   * Array of auction floors. This method should fetch
   * the first item from the auctionhouses's database
   * for the artwork to auction
   */
  createNewAuctionFloorNonPlayer(minBid: number): void;

  /**
   * Creates a new auction floor owned by a player
   * @param player: Player who's auction floor it is
   * @param artwork: The artwork to auction off
   */
  createNewAuctionFloorPlayer(player: Player, artwork: Artwork, mindBid: number): void;
  /**
   * Joins an auction floor as an observer
   * @param player: The player to join
   * @param floorID: The floor to join
   */
  joinFloorAsObserver(player: Player, floorID: string): void;
  /**
   * Joins an auction floor as a bidder
   * @param player: The player to join
   * @param floorID: The floor to join
   */
  joinFloorAsBidder(player: Player, floorID: string): void;

  /**
   * Gets the type of this class (for instantiation w/ tile map)
   */
  getType(): InteractableType; // required for the toModel() method which returns an InteractableType;
  /**
   * Model to send to the frontend
   */
  toModel(): AuctionHouseModel;
}

export interface AuctionHouseModel extends Interactable {
  floors: AuctionFloorModel[];
}
