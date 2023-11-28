import {
  ArtAuctionAccount,
  Artwork,
  AuctionFloorArea,
  AuctionHouseArea as AuctionHouseAreaModel,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that the ArtAuctionHouseAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type AuctionHouseAreaEvents = BaseInteractableEventMap & {
  floorsChanged: (floors: AuctionFloorArea[]) => void;
  floorJoined: (floor: AuctionFloorArea) => void;
  floorLeft: (floor: AuctionFloorArea) => void;
  artAccountUpdated: (account: ArtAuctionAccount) => void;
  floorTakenDown: (floorID: string) => void;
};

/**
 * A ConversationAreaController manages the local behavior of a conversation area in the frontend,
 * implementing the logic to bridge between the townService's interpretation of auction house areas and the
 * frontend's. The ArtAuctionHouseAreaController emits events when the conversation area changes.
 */
export default class AuctionHouseAreaController extends InteractableAreaController<
  AuctionHouseAreaEvents,
  AuctionHouseAreaModel
> {
  private _auctionFloors: AuctionFloorArea[];

  private _townController: TownController;

  /**
   * Create a new ArtAuctionHouseAreaController
   * @param id
   * @param artwork
   */
  constructor(id: string, auctionFloors: AuctionFloorArea[], townController: TownController) {
    super(id);
    this._auctionFloors = auctionFloors;
    this._townController = townController;
  }

  public isActive(): boolean {
    return this.occupants.length > 0;
  }

  /**
   * The topic of the conversation area. Changing the topic will emit a topicChange event
   *
   * Setting the topic to the value `undefined` will indicate that the conversation area is not active
   */
  set auctionFloors(auctionFloors: AuctionFloorArea[]) {
    this.emit('interactableAreaChanged', this.toInteractableAreaModel());
    this._auctionFloors = auctionFloors;
  }

  /**
   * Returns list of Auction Floor Areas
   */
  get auctionFloors(): AuctionFloorArea[] {
    return this._auctionFloors;
  }

  /**
   *  Sends an interactable command to joing floor emits a floorJoined event
   * @param floor Floor being joined
   * @param asBidder true if player joining is joining as bidder, false if joining as observer
   */
  public async joinFloor(floor: AuctionFloorArea, asBidder: boolean) {
    const { floorJoined } = await this._townController.sendInteractableCommand(this.id, {
      type: 'JoinAuctionFloor',
      floor: floor,
      asBidder: asBidder,
    });
    this.emit('floorJoined', floorJoined);
  }

  /**
   * Sends command to leave floor and emits a 'floorLeft' event
   * @param floor floor being left
   */
  public async leaveFloor(floor: AuctionFloorArea) {
    const { floorLeft } = await this._townController.sendInteractableCommand(this.id, {
      type: 'LeaveAuctionFloor',
      floor: floor,
    });
    this.emit('floorLeft', floorLeft);
  }

  /**
   * Sends a command to make a bid
   * @param floor the AuctionFloorArea where bid is made
   * @param bid the bid amount
   */
  public async makeBid(floor: AuctionFloorArea, bid: number) {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'MakeBid',
      floor: floor,
      bid: bid,
    });
  }

  /**
   * Sends a command to auction our artwork
   * @param artwork the chosen artwork to be put up for auction
   * @param bid the starting bid amount
   */
  public async auctionOurArtwork(artwork: Artwork, bid: number) {
    await this._townController.sendInteractableCommand(this.id, {
      type: 'AuctionOurArtwork',
      artwork: artwork,
      bid: bid,
    });
  }

  /**
   * Sends a command to take down our auction floor and emits a 'floorTakenDown' event
   * @param artwork the artwork associated with the floor being taken down
   */
  public async takeDownAuction(artwork: Artwork) {
    const floor = this._auctionFloors.find(af => af.artBeingAuctioned.id === artwork.id);
    if (floor !== undefined) {
      await this._townController.sendInteractableCommand(this.id, {
        type: 'TakeDownOurAuction',
        floor: floor,
      });
      this.emit('floorTakenDown', floor.id);
    }
  }

  protected _updateFrom(newModel: AuctionHouseAreaModel): void {
    this.auctionFloors = newModel.floors;
    this.emit('floorsChanged', newModel.floors);

    const ourPlayer = newModel.occupantsObj.find(o => o.id === this._townController.ourPlayer.id);
    if (ourPlayer) {
      this._townController.ourPlayer.artAuctionAccount = ourPlayer.artAuctionAccount;

      this._townController.emit(
        'artAccountUpdated',
        this._townController.ourPlayer.artAuctionAccount as ArtAuctionAccount,
      );
    }
  }

  /**
   * A conversation area is empty if there are no occupants in it, or the topic is undefined.
   */
  isEmpty(): boolean {
    return this.occupants.length === 0;
  }

  /**
   * Return a representation of this ConversationAreaController that matches the
   * townService's representation and is suitable for transmitting over the network.
   */
  toInteractableAreaModel(): AuctionHouseAreaModel {
    return {
      id: this.id,
      occupants: this.occupants.map(player => player.id),
      floors: this.auctionFloors,
      type: 'AuctionHouseArea',
      occupantsObj: this.occupants.map(player => player.toPlayerModel()),
    };
  }

  /**
   * Create a new ConversationAreaController to match a given ConversationAreaModel
   * @param convAreaModel Conversation area to represent
   * @param playerFinder A function that will return a list of PlayerController's
   *                     matching a list of Player ID's
   */
  static fromAuctionHouseAreaModel(
    auctionHouseAreaModel: AuctionHouseAreaModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
    townController: TownController,
  ): AuctionHouseAreaController {
    const ret = new AuctionHouseAreaController(
      auctionHouseAreaModel.id,
      auctionHouseAreaModel.floors,
      townController,
    );
    ret.occupants = playerFinder(auctionHouseAreaModel.occupants);
    return ret;
  }
}
