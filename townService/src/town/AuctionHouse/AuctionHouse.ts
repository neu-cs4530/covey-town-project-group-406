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
  AuctionFloorArea,
  AuctionHouseArea,
  InteractableID,
} from '../../types/CoveyTownSocket';
import InteractableArea from '../InteractableArea';
import AuctionFloor from '../AuctionFloor/AuctionFloor';

export default class AuctionHouse extends InteractableArea {
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

  public async addArtworksToAuctionHouse(artworks: Artwork[]) {
    await AuctionFloor.DAO.addArtworksToAuctionHouse(artworks);
    const artworksInAuctionHouse = await AuctionFloor.DAO.getAllAuctionHouseArtworks();
    AuctionHouse.artworkToBeAuctioned = artworksInAuctionHouse;
  }

  public makeBid(player: Player, floorID: string, bid: number): void {
    const floor = this.auctionFloors.find(f => f.id === floorID);
    if (floor) {
      if (
        (floor.currentBid === undefined && bid > floor.minBid) ||
        (floor.currentBid !== undefined && bid > floor.currentBid.bid)
      ) {
        if (floor.currentBid) {
          floor.currentBid.player = player;
          floor.currentBid.bid = bid;
        } else {
          floor.currentBid = {
            player,
            bid,
          };
        }
      }
    } else {
      throw new Error('floor not found');
    }
  }

  public async createNewAuctionFloorNonPlayer(minBid: number): Promise<void> {
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
        undefined,
        [],
        [],
        minBid,
        undefined,
      );
      floor.on('auctionEnded', f => {
        this._resetAuctionFloor(f.id);
      });
      floor.on('timeDecreased', t => {
        this._emitAreaChanged();
      });
      this._auctionFloors.push(floor);
    }
  }

  private async _deleteAuctionFloor(floorID: string): Promise<void> {
    const f = this.auctionFloors.find(floor => floor.id === floorID);
    if (f && !f.currentBid && f.artBeingAuctioned && f.auctioneer) {
      await AuctionFloor.DAO.updatePlayerArtworkById(f.auctioneer.email, f.artBeingAuctioned);
    }
    const res = this._auctionFloors.filter(floor => floor.id !== floorID);
    if (res.length === this.auctionFloors.length) {
      throw new Error('no floor with id found');
    }
    this._auctionFloors = res;
    this._emitAreaChanged();
  }

  private async _removeSoldArtworkFromAuctionHouse(art: Artwork) {
    await AuctionFloor.DAO.removeArtworkFromAuctionHouseById(art.id);
    AuctionHouse.artworkToBeAuctioned = AuctionHouse.artworkToBeAuctioned.filter(
      a => a.id !== art.id,
    );
  }

  private _findAndSetNextArtworkForAuctionFloor(floor: AuctionFloor) {
    const newArtToBeAuctioned = AuctionHouse.artworkToBeAuctioned.find(
      artwork => artwork.isBeingAuctioned === false,
    );
    if (newArtToBeAuctioned) {
      floor.artBeingAuctioned = newArtToBeAuctioned;
    } else {
      throw new Error('no artwork left');
    }
  }

  private async _prepareAuctionFloorForNextAuction(floor: AuctionFloor) {
    floor.status = 'WAITING_TO_START';
    floor.artBeingAuctioned.isBeingAuctioned = true;
    floor.timeLeft = 30;
    floor.currentBid = undefined;
    floor.observers = [];
    floor.bidders = [];
  }

  private async _resetAuctionFloor(floorID: string): Promise<void> {
    const currentFloor = this._auctionFloors.find(f => f.id === floorID);
    if (currentFloor) {
      if (currentFloor.currentBid !== undefined) {
        await this._removeSoldArtworkFromAuctionHouse(currentFloor.artBeingAuctioned);
        this._findAndSetNextArtworkForAuctionFloor(currentFloor);
      } else {
        currentFloor.artBeingAuctioned.isBeingAuctioned = true;
        await AuctionFloor.DAO.updateAuctionHouseArtworkByID(currentFloor.artBeingAuctioned);
      }
      await this._prepareAuctionFloorForNextAuction(currentFloor);
    } else {
      throw new Error('no floor with id found');
    }
    this._emitAreaChanged();
  }

  public async createNewAuctionFloorPlayer(
    player: Player,
    artwork: Artwork,
    minBid: number,
  ): Promise<void> {
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
    const floor = new AuctionFloor(nanoid(), artwork, 30, undefined, [player], [], minBid, player);
    floor.on('auctionEnded', f => {
      this._deleteAuctionFloor(f.id);
    });
    floor.on('timeDecreased', t => {
      this._emitAreaChanged();
    });
    this._auctionFloors.push(floor);
  }

  public getType(): InteractableType {
    return 'AuctionHouseArea';
  }

  public toModel(): AuctionHouseArea {
    const floorArray: AuctionFloorArea[] = [];
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

  public get isActive(): boolean {
    return this._occupants.length > 0;
  }

  public remove(player: Player) {
    super.remove(player);
    if (this._occupants.length === 0) {
      this._emitAreaChanged();
    }
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    throw new Error('Method not implemented.');
  }

  public static fromMapObject(
    mapObject: ITiledMapObject,
    broadcastEmitter: TownEmitter,
  ): AuctionHouse {
    const { name, width, height } = mapObject;
    if (!width || !height) {
      throw new Error(`Malformed viewing area ${name}`);
    }
    const rect: BoundingBox = { x: mapObject.x, y: mapObject.y, width, height };
    return new AuctionHouse(name as InteractableID, rect, broadcastEmitter);
  }
}
