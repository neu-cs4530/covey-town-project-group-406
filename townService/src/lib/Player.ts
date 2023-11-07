import { nanoid } from 'nanoid';
import {
  Player as PlayerModel,
  PlayerLocation,
  TownEmitter,
  Artwork,
  Wallet,
} from '../types/CoveyTownSocket';

/**
 * Each user who is connected to a town is represented by a Player object
 */
export default class Player {
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

  private _email: string;

  private _wallet: Wallet;

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
    this._email = '';
    this._wallet = {
      money: 1_000_000,
      artwork: [],
      networth: 1_000_000,
    };
  }

  get wallet(): Wallet {
    return this._wallet;
  }

  set wallet(w: Wallet) {
    this._wallet = w;
  }

  get userName(): string {
    return this._userName;
  }

  set email(email: string) {
    this._email = email;
  }

  get email(): string {
    return this._email;
  }

  set networth(nw: number) {
    this._wallet.networth = nw;
  }

  get networth(): number {
    return this._wallet.networth;
  }

  public addArtwork(art: Artwork) {
    this._wallet.artwork.push(art);
  }

  public removeArtwork(art: Artwork) {
    this._wallet.artwork = this._wallet.artwork.filter(a => a.id !== art.id);
  }

  set artwork(arts: Artwork[]) {
    this._wallet.artwork = arts;
  }

  get artwork(): Artwork[] {
    return this._wallet.artwork;
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
      email: this._email,
      wallet: {
        networth: this._wallet.networth,
        artwork: this._wallet.artwork,
        money: this._wallet.money,
      },
    };
  }
}
