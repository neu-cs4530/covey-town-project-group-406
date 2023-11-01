import { EventEmitter } from 'stream';
import Player from '../../lib/Player';
import { Player as PlayerModel } from '../../types/CoveyTownSocket';
import { Artwork } from '../../types/Artwork';
import ArtworkDAO from '../../db/ArtworkDAO';
import IAuctionFloor, { Status, Bid, AuctionFloorModel } from './IAuctionFloor';

export default class AuctionFloor extends EventEmitter implements IAuctionFloor {
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
  }

  public emitAuctionEndEvent(): void {
    this.emit('auctionEnded', this);
  }

  public toModel(): AuctionFloorModel {
    return {
      _id: this._id,
      _status: this._status,
      _artBeingAuctioned: this._artBeingAuctioned,
      _timeLeft: this._timeLeft,
      _currentBid: { player: this._currentBid.player?.toPlayerModel(), bid: this._currentBid.bid },
      _auctioneer: this._auctioneer?.toPlayerModel(),
      _observers: this._observers.map(o => o.toPlayerModel()) as PlayerModel[],
      _bidders: this._bidders.map(b => b.toPlayerModel()) as PlayerModel[],
    };
  }

  public async giveArtworkToPlayer(): Promise<void> {
    const winner = this._currentBid.player;
    if (winner !== undefined) {
      winner.addArtwork(this._artBeingAuctioned);
      await AuctionFloor.DAO.addArtworkToPlayer(winner.email, this._artBeingAuctioned);
    }
  }

  public async removeArtworkFromPlayer(): Promise<void> {
    if (this._auctioneer) {
      this._auctioneer.removeArtwork(this._artBeingAuctioned);
      await AuctionFloor.DAO.removeArtworkFromPlayerById(
        this._auctioneer.email,
        this._artBeingAuctioned.id,
      );
    }
  }

  public decreaseAuctionTimeLeft(): void {
    this._timeLeft -= 1;
    this.emit('timeDecreased', this._timeLeft);
  }

  public async endAuction(): Promise<void> {
    this.status = 'ENDED';
    if (this._currentBid.player !== undefined) {
      if (this._auctioneer) {
        await this.removeArtworkFromPlayer();
      }
      await this.giveArtworkToPlayer();
    }
    this.emitAuctionEndEvent();
  }

  public startAuction(): void {
    this.status = 'IN_PROGRESS';
    const x = setInterval(() => {
      this.decreaseAuctionTimeLeft();
      if (this._timeLeft <= 0) {
        clearInterval(x);
        this.endAuction();
      }
    }, 1000);
  }
}
