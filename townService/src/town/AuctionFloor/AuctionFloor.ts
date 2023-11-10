/* import { EventEmitter } from 'events';
import Player from '../../lib/Player';
import { Player as PlayerModel, Artwork, AuctionFloorModel } from '../../types/CoveyTownSocket';
import ArtworkDAO from '../../db/ArtworkDAO';
import IAuctionFloor, { Status, Bid } from './IAuctionFloor'; */

/* export default class AuctionFloor extends EventEmitter implements IAuctionFloor {
  // DAO instance
  static DAO = new ArtworkDAO();

  // The ID of this auction floor (unique using nanoid())
  private _id: string;

  // Determines auction floor status
  private _status: Status;

  // The piece of art being auctioned on the floor
  private _artBeingAuctioned: Artwork;

  // How much time is left in the auction
  private _timeLeft: number;

  // The most recently accepted bid
  private _currentBid: Bid;

  // The player who is hosting the auction, if
  // This is an auction house's auction, player is undefined
  private _auctioneer: Player | undefined;

  // Players who are not bidding, just observing
  private _observers: Player[];

  // Players who are able to bid
  private _bidders: Player[];

  private _minBid: number;

  set minBid(b: number) {
    this._minBid = b;
  }

  get minBid(): number {
    return this._minBid;
  }

  set bidders(b: Player[]) {
    this._bidders = b;
  }

  get bidders(): Player[] {
    return this._bidders;
  }

  set observers(o: Player[]) {
    this._observers = o;
  }

  get observers(): Player[] {
    return this._observers;
  }

  set auctioneer(a: Player | undefined) {
    this._auctioneer = a;
  }

  get auctioneer(): Player | undefined {
    return this._auctioneer;
  }

  get currentBid(): Bid {
    return this._currentBid;
  }

  set currentBid(b: Bid) {
    this._currentBid = b;
  }

  get timeLeft(): number {
    return this._timeLeft;
  }

  set timeLeft(time: number) {
    this._timeLeft = time;
  }

  get artBeingAuctioned(): Artwork {
    return this._artBeingAuctioned;
  }

  set artBeingAuctioned(art: Artwork) {
    this._artBeingAuctioned = art;
  }

  get status(): Status {
    return this._status;
  }

  set status(status: Status) {
    this._status = status;
  }

  get id(): string {
    return this._id;
  }

  set id(id: string) {
    this._id = id;
  }

  constructor(
    id: string,
    art: Artwork,
    timeLeft: number,
    currentBid: Bid,
    observers: Player[],
    bidders: Player[],
    minBid: number,
    auctioneer?: Player,
  ) {
    super();
    this._id = id;
    this._status = 'WAITING_TO_START';
    this._artBeingAuctioned = art;
    this._timeLeft = timeLeft;
    this._currentBid = currentBid;
    this._auctioneer = auctioneer;
    this._observers = observers;
    this._bidders = bidders;
    this._minBid = minBid;
  }

  private _emitAuctionEndEvent(): void {
    this.emit('auctionEnded', this);
  }

  public toModel(): AuctionFloorModel {
    return {
      id: this._id,
      status: this._status,
      minBid: this._minBid,
      artBeingAuctioned: this._artBeingAuctioned,
      timeLeft: this._timeLeft,
      currentBid: this._currentBid.player
        ? { player: this._currentBid.player, bid: this._currentBid.bid }
        : undefined,
      auctioneer: this._auctioneer?.toPlayerModel(),
      observers: this._observers.map(o => o.toPlayerModel()) as PlayerModel[],
      bidders: this._bidders.map(b => b.toPlayerModel()) as PlayerModel[],
    };
  }

  private async _giveArtworkToBuyer(): Promise<void> {
    const winner = this._currentBid.player;
    if (winner !== undefined && this.currentBid.player?.email) {
      const artwork = { ...this._artBeingAuctioned };
      artwork.isBeingAuctioned = false;
      await winner.addArtwork(artwork);
      await AuctionFloor.DAO.addArtworksToPlayer(this.currentBid.player?.email, [
        this.artBeingAuctioned,
      ]);
    }
  }

  private async _removeArtworkFromAuctioneer(): Promise<void> {
    if (this._auctioneer) {
      await this._auctioneer.removeArtwork(this._artBeingAuctioned);
      await AuctionFloor.DAO.removeArtworkFromPlayerById(
        this._auctioneer.email,
        this.artBeingAuctioned.id,
      );
    }
  }

  private _decreaseAuctionTimeLeft(): void {
    this._timeLeft -= 1;
    this.emit('timeDecreased', this._timeLeft);
  }

  private async _addMoneyToAuctioneer() {
    if (this._auctioneer) {
      this._auctioneer.wallet.money += this.currentBid.bid;
      this._auctioneer.calculateNetWorth();
      await AuctionFloor.DAO.updatePlayer(
        this._auctioneer.email,
        true,
        this._auctioneer.wallet.money,
      );
    }
  }

  private async _removeMoneyFromBuyer() {
    if (this._currentBid.player !== undefined) {
      this._currentBid.player.wallet.money -= this.currentBid.bid;
      this._currentBid.player.calculateNetWorth();
      await AuctionFloor.DAO.updatePlayer(
        this._currentBid.player.email,
        true,
        this._currentBid.player.wallet.money,
      );
    }
  }

  private async _endAuction(): Promise<void> {
    this.status = 'ENDED';
    this.artBeingAuctioned.isBeingAuctioned = false;
    if (this._currentBid.player !== undefined) {
      this.artBeingAuctioned.purchasePrice = this.currentBid.bid;
      if (this._auctioneer) {
        await this._removeArtworkFromAuctioneer();
        await this._addMoneyToAuctioneer();
      }
      await this._giveArtworkToBuyer();
      await this._removeMoneyFromBuyer();
    }

    this._emitAuctionEndEvent();
  }

  public startAuction(): void {
    this.status = 'IN_PROGRESS';
    const x = setInterval(() => {
      this._decreaseAuctionTimeLeft();
      if (this._timeLeft <= 0) {
        clearInterval(x);
        this._endAuction();
      }
    }, 1000);
  }
}
*/
