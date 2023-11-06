import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { nanoid } from 'nanoid';
import Player from '../../lib/Player';
import { Artwork } from '../../types/Artwork';
import {
  TownEmitter,
  InteractableType,
  InteractableCommand,
  InteractableCommandReturnType,
  BoundingBox,
} from '../../types/CoveyTownSocket';
import { AuctionFloorModel } from '../AuctionFloor/IAuctionFloor';
import IAuctionHouse, { AuctionHouseModel } from './IAuctionHouse';
import InteractableArea from '../InteractableArea';
import AuctionFloor from '../AuctionFloor/AuctionFloor';

export default class AuctionHouse extends InteractableArea implements IAuctionHouse {
  private _auctionFloors: AuctionFloor[];

  static artworkToBeAuctioned: Artwork[] = [];

  private _indexOfArtToBeAuctioned: number;

  get indexOfArtToBeAuctioned(): number {
    return this._indexOfArtToBeAuctioned;
  }

  set auctionFloors(af: AuctionFloor[]) {
    this._auctionFloors = af;
  }

  get auctionFloors(): AuctionFloor[] {
    return this._auctionFloors;
  }

  constructor(id: string, coordinates: BoundingBox, townEmitter: TownEmitter) {
    super(id, coordinates, townEmitter);
    this._auctionFloors = [];
    this._indexOfArtToBeAuctioned = 0;
  }

  public joinFloorAsObserver(player: Player, floorID: string): void {
    for (const floor of this._auctionFloors) {
      if (floor.id === floorID) {
        floor.observers.push(player);
        return;
      }
    }
    throw new Error('no floor with ID found');
  }

  public joinFloorAsBidder(player: Player, floorID: string): void {
    for (const floor of this._auctionFloors) {
      if (floor.id === floorID) {
        floor.bidders.push(player);
        return;
      }
    }
    throw new Error('no floor with ID found');
  }

  public async setAuctionHouseArtworks(artworks: Artwork[]) {
    AuctionHouse.artworkToBeAuctioned = artworks;
    await AuctionFloor.DAO.setAuctionHouseArtworks(artworks);
  }

  public createNewAuctionFloorNonPlayer(): void {
    const artworkToAuction = AuctionHouse.artworkToBeAuctioned[this._indexOfArtToBeAuctioned++];
    artworkToAuction.isBeingAuctioned = true;
    const floor = new AuctionFloor(
      nanoid(),
      artworkToAuction,
      30,
      { player: undefined, bid: 0 },
      [],
      [],
      undefined,
    );
    floor.on('auctionEnded', f => {
      this.resetAuctionFloor(f.id);
    });
    floor.on('timeDecreased', t => {
      this._emitAreaChanged();
    });
    this._auctionFloors.push(floor);
  }

  public deleteAuctionFloor(floorID: string): void {
    const res = this._auctionFloors.filter(floor => floor.id !== floorID);
    if (res.length === this.auctionFloors.length) {
      throw new Error('no floor with id found');
    }
    this._auctionFloors = res;
    this._emitAreaChanged();
  }

  // make sure to remove artwork here
  public async resetAuctionFloor(floorID: string): Promise<void> {
    const currentFloor = this._auctionFloors.find(f => f.id === floorID);
    if (currentFloor) {
      if (currentFloor.currentBid.player !== undefined) {
        await AuctionFloor.DAO.removeArtworkFromAuctionHouse(currentFloor.artBeingAuctioned);
        AuctionHouse.artworkToBeAuctioned = AuctionHouse.artworkToBeAuctioned.filter(
          a => a.id !== currentFloor.artBeingAuctioned.id,
        );
        this._indexOfArtToBeAuctioned -= 1;
        if (this.indexOfArtToBeAuctioned >= AuctionHouse.artworkToBeAuctioned.length) {
          throw new Error('no artwork left in the auction house!');
        }
        const newArtToBeAuctioned =
          AuctionHouse.artworkToBeAuctioned[this._indexOfArtToBeAuctioned++];
        currentFloor.artBeingAuctioned = newArtToBeAuctioned;
      }
      currentFloor.artBeingAuctioned.isBeingAuctioned = true;
      currentFloor.status = 'WAITING_TO_START';
      currentFloor.timeLeft = 30;
      currentFloor.currentBid = { player: undefined, bid: 0 };
    } else {
      throw new Error('no floor with id found');
    }
  }

  public createNewAuctionFloorPlayer(player: Player, artwork: Artwork): void {
    let playerHasArtwork = false;
    for (const a of player.artwork) {
      if (artwork.id === a.id) {
        playerHasArtwork = true;
      }
    }
    if (!playerHasArtwork) {
      throw new Error('player does not have artwork with id');
    }

    artwork.isBeingAuctioned = true;
    const floor = new AuctionFloor(
      nanoid(),
      artwork,
      30,
      { player: undefined, bid: 0 },
      [player],
      [],
      player,
    );
    floor.on('auctionEnded', f => {
      this.deleteAuctionFloor(f.id);
    });
    floor.on('timeDecreased', t => {
      this._emitAreaChanged();
    });
    this._auctionFloors.push(floor);
  }

  public getType(): InteractableType {
    return 'AuctionHouseArea';
  }

  public toModel(): AuctionHouseModel {
    const floorArray: AuctionFloorModel[] = [];
    for (const floor of this._auctionFloors) {
      floorArray.push(floor.toModel());
    }
    return {
      id: this.id,
      occupants: this.occupantsByID,
      type: this.getType(),
      floors: floorArray,
    };
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    throw new Error('Method not implemented.');
  }

  static fromMapObject(mapObject: ITiledMapObject, broadcastEmitter: TownEmitter): AuctionHouse {
    throw new Error('not impl');
  }
}
