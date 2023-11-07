import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { nanoid } from 'nanoid';
import Player from '../../lib/Player';
import {
  Artwork,
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

  set auctionFloors(af: AuctionFloor[]) {
    this._auctionFloors = af;
  }

  get auctionFloors(): AuctionFloor[] {
    return this._auctionFloors;
  }

  constructor(id: string, coordinates: BoundingBox, townEmitter: TownEmitter) {
    super(id, coordinates, townEmitter);
    this._auctionFloors = [];
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
    await AuctionFloor.DAO.addArtworksToAuctionHouse(artworks);
  }

  public async createNewAuctionFloorNonPlayer(): Promise<void> {
    const artworkToAuction = AuctionHouse.artworkToBeAuctioned.find(
      artwork => artwork.isBeingAuctioned === false,
    );
    if (artworkToAuction) {
      artworkToAuction.isBeingAuctioned = true;
      await AuctionFloor.DAO.updateAuctionHouseArtworkByID(artworkToAuction);
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
  }

  public async deleteAuctionFloor(floorID: string): Promise<void> {
    const f = this.auctionFloors.find(floor => floor.id === floorID);
    if (f && !f.currentBid.player && f.artBeingAuctioned && f.auctioneer) {
      await AuctionFloor.DAO.updatePlayerArtworkById(f.auctioneer.email, f.artBeingAuctioned);
    }
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
        await AuctionFloor.DAO.removeArtworkFromAuctionHouseById(currentFloor.artBeingAuctioned.id);
        AuctionHouse.artworkToBeAuctioned = AuctionHouse.artworkToBeAuctioned.filter(
          a => a.id !== currentFloor.artBeingAuctioned.id,
        );
        const newArtToBeAuctioned = AuctionHouse.artworkToBeAuctioned.find(
          artwork => artwork.isBeingAuctioned === false,
        );
        if (newArtToBeAuctioned) {
          currentFloor.artBeingAuctioned = newArtToBeAuctioned;
        } else {
          throw new Error('no artwork left');
        }
      }
      currentFloor.artBeingAuctioned.isBeingAuctioned = true;
      await AuctionFloor.DAO.updateAuctionHouseArtworkByID(currentFloor.artBeingAuctioned);
      currentFloor.status = 'WAITING_TO_START';
      currentFloor.timeLeft = 30;
      currentFloor.currentBid = { player: undefined, bid: 0 };
    } else {
      throw new Error('no floor with id found');
    }
  }

  public async createNewAuctionFloorPlayer(player: Player, artwork: Artwork): Promise<void> {
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
    await AuctionFloor.DAO.updatePlayerArtworkById(player.email, artwork);
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
