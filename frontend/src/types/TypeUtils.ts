import {
  ConversationArea,
  Interactable,
  TicTacToeGameState,
  ViewingArea,
  GameArea,
  ArtAuctionHouseArea,
} from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return interactable.type === 'ConversationArea';
}

export function isArtAuctionHouseArea(interactable: Interactable): interactable is ArtAuctionHouseArea {
  return interactable.type === 'ArtAuctionHouseArea';
}

/**
 * Test to see if an interactable is a viewing area
 */
export function isViewingArea(interactable: Interactable): interactable is ViewingArea {
  return interactable.type === 'ViewingArea';
}

export function isTicTacToeArea(
  interactable: Interactable,
): interactable is GameArea<TicTacToeGameState> {
  return interactable.type === 'TicTacToeArea';
}
