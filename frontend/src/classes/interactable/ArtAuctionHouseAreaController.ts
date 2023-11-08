import { useEffect, useState } from 'react';
import { ArtAuctionHouseArea as ArtAuctionHouseAreaModel } from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import InteractableAreaController, { BaseInteractableEventMap } from './InteractableAreaController';

/**
 * The events that the ArtAuctionHouseAreaController emits to subscribers. These events
 * are only ever emitted to local components (not to the townService).
 */
export type ArtAuctionHouseAreaEvents = BaseInteractableEventMap & {
  artworkChange: (newArtwork: string | undefined) => void;
};

// The special string that will be displayed when a auction house area does not have an artwork set
export const NO_ARTWORK_STRING = '(No artwork)';
/**
 * A ConversationAreaController manages the local behavior of a conversation area in the frontend,
 * implementing the logic to bridge between the townService's interpretation of auction house areas and the
 * frontend's. The ArtAuctionHouseAreaController emits events when the conversation area changes.
 */
export default class ArtAuctionHouseAreaController extends InteractableAreaController<
    ArtAuctionHouseAreaEvents,
    ArtAuctionHouseAreaModel
> {
  private _artwork?: string;

  /**
   * Create a new ArtAuctionHouseAreaController
   * @param id
   * @param artwork
   */
  constructor(id: string, artwork?: string) {
    super(id);
    this._artwork = artwork;
  }

  public isActive(): boolean {
    return this.artwork !== undefined && this.occupants.length > 0;
  }

  /**
   * The topic of the conversation area. Changing the topic will emit a topicChange event
   *
   * Setting the topic to the value `undefined` will indicate that the conversation area is not active
   */
  set artwork(newArtwork: string | undefined) {
    if (this._artwork !== newArtwork) {
      this.emit('artworkChange', newArtwork);
    }
    this._artwork = newArtwork;
  }

  get artwork(): string | undefined {
    return this._artwork;
  }

  protected _updateFrom(newModel: ArtAuctionHouseAreaModel): void {
    this.artwork = newModel.artwork;
  }

  /**
   * A conversation area is empty if there are no occupants in it, or the topic is undefined.
   */
  isEmpty(): boolean {
    return this._artwork === undefined || this.occupants.length === 0;
  }

  /**
   * Return a representation of this ConversationAreaController that matches the
   * townService's representation and is suitable for transmitting over the network.
   */
  toInteractableAreaModel(): ArtAuctionHouseAreaModel {
    return {
      id: this.id,
      occupants: this.occupants.map(player => player.id),
      artwork: this.artwork,
      type: 'ArtAuctionHouseArea',
    };
  }

  /**
   * Create a new ConversationAreaController to match a given ConversationAreaModel
   * @param convAreaModel Conversation area to represent
   * @param playerFinder A function that will return a list of PlayerController's
   *                     matching a list of Player ID's
   */
  static fromArtAuctionHouseAreaModel(
    artAuctionHouseAreaModel: ArtAuctionHouseAreaModel,
    playerFinder: (playerIDs: string[]) => PlayerController[],
  ): ArtAuctionHouseAreaController {
    const ret = new ArtAuctionHouseAreaController(artAuctionHouseAreaModel.id, artAuctionHouseAreaModel.artwork);
    ret.occupants = playerFinder(artAuctionHouseAreaModel.occupants);
    return ret;
  }
}

/**
 * A react hook to retrieve the topic of a ConversationAreaController.
 * If there is currently no topic defined, it will return NO_TOPIC_STRING.
 *
 * This hook will re-render any components that use it when the topic changes.
 */
export function useArtAuctionHouseAreaArtwork(area: ArtAuctionHouseAreaController): string {
  const [artwork, setArtwork] = useState(area.artwork);
  useEffect(() => {
    area.addListener('artworkChange', setArtwork);
    return () => {
      area.removeListener('topicChange', setArtwork);
    };
  }, [area]);
  return artwork || NO_ARTWORK_STRING;
}
