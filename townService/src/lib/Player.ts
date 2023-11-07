import { nanoid } from 'nanoid';
import {
  Player as PlayerModel,
  PlayerLocation,
  TownEmitter,
  Artwork,
  Wallet,
  ArtAuctionAccount,
} from '../types/CoveyTownSocket';
import ArtworkDAO from '../db/ArtworkDAO';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Player {
  static dao = new ArtworkDAO();

  /** The current location of this user in the world map * */
  public location: PlayerLocation;

  /** The unique identifier for this player * */
  private readonly _id: string;

  /** The player's username, which is not guaranteed to be unique within the town * */
  private readonly _userName: string;

  /** The secret token that allows this client to access our Covey.Town service for this town * */
  private readonly _sessionToken: string;

  /** The secret token that allows this client to access our video resources for this town * */
  private _videoToken?: string;

  /** A special town emitter that will emit events to the entire town BUT NOT to this player */
  public readonly townEmitter: TownEmitter;

  private _artAuctionAccount: ArtAuctionAccount | undefined;

  constructor(userName: string, townEmitter: TownEmitter) {
    this.location = {
      x: 0,
      y: 0,
      moving: false,
      rotation: 'front',
    };
    this._userName = userName;
    this._id = nanoid();
    this._sessionToken = nanoid();
    this.townEmitter = townEmitter;
    this._artAuctionAccount = undefined;
  }

  // this needs to use the DAO to get the information
  public initializeArtAuctionAccount(email: string) {
    this._artAuctionAccount = {
      email,
      wallet: {
        money: 1_000_000,
        artwork: [],
        networth: 1_000_000,
      },
    };
  }

  get wallet(): Wallet {
    if (this._artAuctionAccount) {
      return this._artAuctionAccount?.wallet;
    }
    throw new Error('art auction account not defined for user');
  }

  public async setWallet(w: Wallet) {
    if (this._artAuctionAccount) {
      this._artAuctionAccount.wallet = w;
      await Player.dao.updatePlayer(this._artAuctionAccount.email, true, w.money);
    }
  }

  get userName(): string {
    return this._userName;
  }

  set email(email: string) {
    if (this._artAuctionAccount) {
      this._artAuctionAccount.email = email;
    }
  }

  get email(): string {
    if (this._artAuctionAccount) {
      return this._artAuctionAccount?.email;
    }
    throw new Error('auction account not defined for user');
  }

  set networth(nw: number) {
    if (this._artAuctionAccount) {
      this._artAuctionAccount.wallet.networth = nw;
    }
  }

  get networth(): number {
    if (this._artAuctionAccount) {
      return this._artAuctionAccount?.wallet.networth;
    }
    throw new Error('auction account not defined for user');
  }

  public async addArtwork(art: Artwork) {
    if (this._artAuctionAccount) {
      this._artAuctionAccount.wallet.artwork.push(art);
      await Player.dao.addArtworksToPlayer(this._artAuctionAccount.email, [art]);
    }
  }

  public async removeArtwork(art: Artwork) {
    if (this._artAuctionAccount) {
      this._artAuctionAccount.wallet.artwork = this._artAuctionAccount.wallet.artwork.filter(
        a => a.id !== art.id,
      );
      await Player.dao.removeArtworkFromPlayerById(this._artAuctionAccount.email, art.id);
    }
  }

  get artwork(): Artwork[] {
    if (this._artAuctionAccount) {
      return this._artAuctionAccount.wallet.artwork;
    }
    throw new Error('auction account not defined for user');
  }

  get id(): string {
    return this._id;
  }

  set videoToken(value: string | undefined) {
    this._videoToken = value;
  }

  get videoToken(): string | undefined {
    return this._videoToken;
  }

  get sessionToken(): string {
    return this._sessionToken;
  }

  toPlayerModel(): PlayerModel {
    return {
      id: this._id,
      location: this.location,
      userName: this._userName,
      artAuctionAccount: this._artAuctionAccount
        ? {
            email: this._artAuctionAccount.email,
            wallet: {
              networth: this._artAuctionAccount.wallet.networth,
              artwork: this._artAuctionAccount.wallet.artwork,
              money: this._artAuctionAccount.wallet.money,
            },
          }
        : undefined,
    };
  }
}
