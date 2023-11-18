import {
  ConversationArea,
  Interactable,
  TicTacToeGameState,
  ViewingArea,
  GameArea,
  AuctionHouseArea,
} from './CoveyTownSocket';

/**
 * Test to see if an interactable is a conversation area
 */
export function isConversationArea(interactable: Interactable): interactable is ConversationArea {
  return interactable.type === 'ConversationArea';
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

export function isAuctionHouseArea(interactable: Interactable): interactable is AuctionHouseArea {
  return interactable.type === 'AuctionHouseArea';
}
