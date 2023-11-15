import { useEffect, useState } from 'react';
import useTownController from '../../hooks/useTownController';
import {
  AuctionFloorArea,
  AuctionHouseArea as AuctionHouseAreaModel,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that the ArtAuctionHouseAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type AuctionHouseAreaEvents = BaseInteractableEventMap & {
  fetchedAuctionFloors: (newFloors: AuctionFloorArea[]) => void;
};

// The special string that will be displayed when a auction house area does not have an artwork set
// export const NO_ARTWORK_STRING = '(No artwork)';

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

  /**
   * Create a new ArtAuctionHouseAreaController
   * @param id
   * @param artwork
   */
  constructor(id: string, auctionFloors: AuctionFloorArea[]) {
    super(id);
    this._auctionFloors = auctionFloors;
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
    this.emit('floorsChange', auctionFloors);
    this._auctionFloors = auctionFloors;
  }

  get auctionFloors(): AuctionFloorArea[] {
    return this._auctionFloors;
  }

  protected _updateFrom(newModel: AuctionHouseAreaModel): void {
    this.auctionFloors = newModel.floors;
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
  ): AuctionHouseAreaController {
    const ret = new AuctionHouseAreaController(
      auctionHouseAreaModel.id,
      auctionHouseAreaModel.floors,
    );
    ret.occupants = playerFinder(auctionHouseAreaModel.occupants);
    return ret;
  }
}

/**
 * A react hook to retrieve the topic of a ConversationAreaController.
 * If there is currently no topic defined, it will return NO_TOPIC_STRING.
 *
 * This hook will re-render any components that use it when the topic changes.
 */
export function useAuctionHouseAreaArtwork(area: AuctionHouseAreaController): AuctionFloorArea[] {
  const [floors, setFloors] = useState(area.auctionFloors);
  const townController = useTownController();

  const handleChanged = () => {
    const auctionController = townController.auctionHouseAreas.find(c => c.id == area.id);
    if (auctionController) {
      setFloors(auctionController.auctionFloors);
    }
  };

  useEffect(() => {
    area.addListener('interactableAreasChanged', handleChanged);
    return () => {
      area.removeListener('interactableAreasChanged', handleChanged);
    };
  }, [area]);

  return floors;
}
