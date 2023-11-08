import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import InvalidParametersError from '../lib/InvalidParametersError';
import Player from '../lib/Player';
import {
  BoundingBox,
  ArtAuctionHouseArea as ArtAuctionHouseAreaModel,
  InteractableCommand,
  InteractableCommandReturnType,
  TownEmitter,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class ArtAuctionHouseArea extends InteractableArea {
  /* The artwork of the auction house area, or undefined if it is not set */
  public artwork?: string;

  /** The auction house area is "active" when there are players inside of it  */
  public get isActive(): boolean {
    return this._occupants.length > 0;
  }

  /**
   * Creates a new ArtAuctionHouseArea
   *
   * @param conversationAreaModel model containing this area's current topic and its ID
   * @param coordinates  the bounding box that defines this conversation area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { artwork, id }: Omit<ArtAuctionHouseAreaModel, 'type'>,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this.artwork = artwork;
  }

  /**
   * Removes a player from this auction house area.
   *
   * Extends the base behavior of InteractableArea to set the topic of this ArtAuctionHouseArea to undefined and
   * emit an update to other players in the town when the last player leaves.
   *
   * @param player
   */
  public remove(player: Player) {
    super.remove(player);
    if (this._occupants.length === 0) {
    //   this.artwork = undefined;
      this._emitAreaChanged();
    }
  }

  /**
   * Convert this ArtAuctionHouseArea instance to a simple ArtAuctionHouseAreaModel suitable for
   * transporting over a socket to a client.
   */
  public toModel(): ArtAuctionHouseAreaModel {
    return {
      id: this.id,
      occupants: this.occupantsByID,
      artwork: this.artwork,
      type: 'ArtAuctionHouseArea',
    };
  }

  /**
   * Creates a new ArtAuctionHouseArea object that will represent a Art Auction House Area object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this conversation area exists
   * @param broadcastEmitter An emitter that can be used by this conversation area to broadcast updates
   * @returns
   */
  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): ArtAuctionHouseArea {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new ArtAuctionHouseArea({ id: name, occupants: [] }, rect, broadcastEmitter);
  }

  public handleCommand<
    CommandType extends InteractableCommand,
  >(): InteractableCommandReturnType<CommandType> {
    throw new InvalidParametersError('Unknown command type');
  }
}
