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
import ArtworkDAO from '../../db/ArtworkDAO';
import SingletonArtworkDAO from '../../db/SingletonArtworkDAO';
import APIUtils from '../../api/APIUtils';

export default class AuctionHouse extends InteractableArea {
  private _auctionFloors: AuctionFloor[];

  private _dao: ArtworkDAO;

  private _apiUtils: APIUtils;

  private _topPlayers: { email: string; artValue: number }[];

  static artworkToBeAuctioned: Artwork[] = [];

  static hasBeenInstantiated = false;

  set auctionFloors(af: AuctionFloor[]) {
    this._auctionFloors = af;
  }

  get auctionFloors(): AuctionFloor[] {
    return this._auctionFloors;
  }

  constructor(id: string, coordinates: BoundingBox, townEmitter: TownEmitter) {
    super(id, coordinates, townEmitter);
    this._auctionFloors = [];
    this._dao = SingletonArtworkDAO.instance();
    this._apiUtils = new APIUtils();
  }

  public async removePlayerOnDisconnect(player: Player) {
    const floor = this.auctionFloors.find(
      f => f.observers.find(p => p.id === player.id) || f.bidders.find(p => p.id === player.id),
    );
    if (floor) {
      this.leaveAuctionFloor(player, floor.id);
    }
    // remove all of the floors where this person is the auctioneer
    for (const f of this.auctionFloors) {
      if (f.auctioneer?.id === player.id) {
        f.artBeingAuctioned.isBeingAuctioned = false;
        this._deleteAuctionFloor(f.id);
      }
    }
  }

  public async leaveAuctionFloor(player: Player, floorID: string): Promise<void> {
    const floor = this.auctionFloors.find(f => f.id === floorID);
    if (floor) {
      // if the person is an observer, just remove them
      if (floor.observers.find(p => p.id === player.id)) {
        floor.observers = floor.observers.filter(o => o.id !== player.id);
      } else if (floor.bidders.find(p => p.id === player.id)) {
        // if their bid is not the curent bid, just remove them too
        floor.bidders = floor.bidders.filter(b => b.id !== player.id);
        // if their bid is the current bid, reset the current bid to undefined
        if (floor.currentBid?.player.id === player.id) {
          floor.currentBid = undefined;
        }
      } else if (floor.auctioneer?.id === player.id) {
        // shut down the auction floor, make it so that the artwork is not being auctioned
        player.removeArtwork(floor.artBeingAuctioned);
        floor.artBeingAuctioned.isBeingAuctioned = false;
        player.addArtwork(floor.artBeingAuctioned);
        await this._dao.updatePlayerArtworkById(player.email, floor.artBeingAuctioned);
        this.auctionFloors = this.auctionFloors.filter(f => f.id !== floorID);
      }
    }
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

  public async addArtworksToAuctionHouse(artworks: Artwork[], endIndex: number) {
    await this._dao.addArtworksToAuctionHouse(artworks, endIndex);
    const artworksInAuctionHouse = await this._dao.getAllAuctionHouseArtworks();
    AuctionHouse.artworkToBeAuctioned = artworksInAuctionHouse;
  }

  public makeBid(player: Player, floorID: string, bid: number): void {
    const floor = this.auctionFloors.find(f => f.id === floorID);
    if (floor) {
      if (
        ((floor.currentBid === undefined && bid >= floor.minBid) ||
          (floor.currentBid !== undefined && bid > floor.currentBid.bid)) &&
        player.wallet.money >= bid
      ) {
        if (floor.currentBid) {
          floor.currentBid.player = player;
          floor.currentBid.bid = bid;
          floor.timeLeft += 5;
        } else {
          floor.currentBid = {
            player,
            bid,
          };
          floor.timeLeft += 5;
        }
      }
    } else {
      throw new Error('floor not found');
    }
  }

  public async createNewAuctionFloorNonPlayer(minBid: number): Promise<void> {
    let artworkToAuction = AuctionHouse.artworkToBeAuctioned.find(
      artwork => artwork.isBeingAuctioned === false,
    );
    while (!artworkToAuction) {
      // eslint-disable-next-line no-await-in-loop
      await this.addNewArtworksToAuctionHouse(30);
      artworkToAuction = AuctionHouse.artworkToBeAuctioned.find(
        artwork => artwork.isBeingAuctioned === false,
      );
    }
    if (artworkToAuction) {
      artworkToAuction.isBeingAuctioned = true;
      await this._dao.updateAuctionHouseArtworkByID(artworkToAuction);
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

  public async addNewArtworksToAuctionHouse(numArtworks: number) {
    const index = await this._dao.getArtworkIndex();
    const artworks = await this._apiUtils.nextArtworks(index, index + numArtworks);
    await this.addArtworksToAuctionHouse(artworks, index + numArtworks);
  }

  public async getTopPlayersLeaderboard(
    numPlayers: number,
  ): Promise<{ email: string; artValue: number }[]> {
    const playerEmails = await this._dao.getAllPlayerEmails();
    const allPlayers: {
      email: string;
      playerInfo: Promise<{ artworks: Artwork[]; money: number; isLoggedIn: boolean }>;
    }[] = [];
    await playerEmails.map(async p => {
      allPlayers.push({ email: p, playerInfo: this._dao.getPlayer(p) });
    });
    const playerArtWorth: { email: string; artValue: number }[] = [];
    allPlayers.map(async p => {
      let totalArtValue = 0;
      // eslint-disable-next-line no-return-assign
      (await p.playerInfo).artworks.map(a => (totalArtValue += a.purchasePrice));
      playerArtWorth.push({ email: p.email, artValue: totalArtValue });
    });

    // eslint-disable-next-line prefer-arrow-callback
    playerArtWorth.sort(function sortValue(a, b) {
      return a.artValue - b.artValue;
    });

    let topPlayers = playerArtWorth;
    if (playerArtWorth.length > numPlayers) {
      topPlayers = playerArtWorth.slice(0, numPlayers);
    }

    return topPlayers;
  }

  private async _deleteAuctionFloor(floorID: string): Promise<void> {
    const f = this.auctionFloors.find(floor => floor.id === floorID);
    if (f && !f.currentBid && f.artBeingAuctioned && f.auctioneer) {
      await this._dao.updatePlayerArtworkById(f.auctioneer.email, f.artBeingAuctioned);
    }
    const res = this._auctionFloors.filter(floor => floor.id !== floorID);
    if (res.length === this.auctionFloors.length) {
      throw new Error('no floor with id found');
    }
    this._auctionFloors = res;
    this._emitAreaChanged();
  }

  private async _removeSoldArtworkFromAuctionHouse(art: Artwork) {
    await this._dao.removeArtworkFromAuctionHouseById(art.id);
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
        await this._dao.updateAuctionHouseArtworkByID(currentFloor.artBeingAuctioned);
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
    if (!playerHasArtwork || artwork.isBeingAuctioned) {
      throw new Error('player does not have artwork with id');
    }
    player.removeArtwork(artwork);
    artwork.isBeingAuctioned = true;
    player.addArtwork(artwork);

    await this._dao.updatePlayerArtworkById(player.email, artwork);
    const floor = new AuctionFloor(nanoid(), artwork, 30, undefined, [], [], minBid, player);
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
    const occupantsObj = this.occupants.map(o => o.toPlayerModel());
    return {
      id: this.id,
      occupants: this.occupantsByID,
      type: this.getType(),
      floors: floorArray,
      occupantsObj,
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
    if (command.type === 'JoinAuctionFloor') {
      if (command.asBidder) {
        this.joinFloorAsBidder(player, command.floor.id);
      } else {
        this.joinFloorAsObserver(player, command.floor.id);
      }
      this._emitAreaChanged();
      const newFloor = this._auctionFloors.find(f => f.id === command.floor.id);
      if (newFloor === undefined) {
        throw new Error();
      }
      if (newFloor.bidders.length >= 3 && newFloor.status !== 'IN_PROGRESS') {
        newFloor.startAuction();
      }
      return { floorJoined: newFloor.toModel() } as InteractableCommandReturnType<CommandType>;
    }

    if (command.type === 'LeaveAuctionFloor') {
      this.leaveAuctionFloor(player, command.floor.id).then();
      this._emitAreaChanged();
      const newFloor = this._auctionFloors.find(f => f.id === command.floor.id);
      if (newFloor === undefined) {
        throw new Error();
      }

      return { floorLeft: newFloor.toModel() } as InteractableCommandReturnType<CommandType>;
    }

    if (command.type === 'MakeBid') {
      this.makeBid(player, command.floor.id, command.bid);
      this._emitAreaChanged();
      const newFloor = this._auctionFloors.find(f => f.id === command.floor.id);
      if (newFloor === undefined) {
        throw new Error();
      }
      return { floor: newFloor.toModel() } as InteractableCommandReturnType<CommandType>;
    }

    if (command.type === 'AuctionOurArtwork') {
      this.createNewAuctionFloorPlayer(player, command.artwork, command.bid).then(() => {
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      });
    }

    if (command.type === 'TakeDownOurAuction') {
      this.leaveAuctionFloor(player, command.floor.id).then(() => {
        this._emitAreaChanged();
        return undefined as InteractableCommandReturnType<CommandType>;
      });
    }

    return undefined as InteractableCommandReturnType<CommandType>;
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
