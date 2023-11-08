import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import Player from '../../lib/Player';
import { Artwork, TownEmitter } from '../../types/CoveyTownSocket';
import ArtworkDAO from '../../db/ArtworkDAO';
import AuctionFloor from './AuctionFloor';

const dao = new ArtworkDAO();

describe('when creating an auction floor', () => {
  let testArtwork: Artwork;
  let player: Player;
  let player2: Player;
  beforeEach(async () => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);

    player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    testArtwork = {
      description: 'Its the Mona Lisa',
      id: 1,
      primaryImage: 'monalisa.png',
      purchasePrice: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artist: { name: 'da Vinci' },
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
      purchaseHistory: [],
    };
  });
  afterEach(async () => {
    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
  });
  it('creates a non player floor properly', () => {
    const floor = new AuctionFloor(
      nanoid(),
      testArtwork,
      1,
      { player: undefined, bid: 0 },
      [player],
      [player2],
      undefined,
    );
    expect(floor.artBeingAuctioned).toEqual(testArtwork);
    expect(floor.timeLeft).toBe(1);
    expect(floor.observers).toEqual([player]);
    expect(floor.bidders).toEqual([player2]);
    expect(floor.auctioneer).toBeUndefined();
  });
  it('creates a plyer floor properly', () => {
    const floor = new AuctionFloor(
      nanoid(),
      testArtwork,
      1,
      { player: undefined, bid: 0 },
      [],
      [player2],
      player,
    );
    expect(floor.artBeingAuctioned).toEqual(testArtwork);
    expect(floor.timeLeft).toBe(1);
    expect(floor.observers).toEqual([]);
    expect(floor.bidders).toEqual([player2]);
    expect(floor.auctioneer).toEqual(player);
  });
});

describe('when an auction starts', () => {
  let testArtwork: Artwork;
  let player: Player;
  let player2: Player;
  beforeEach(async () => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);

    player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    testArtwork = {
      description: 'Its the Mona Lisa',
      id: 1,
      primaryImage: 'monalisa.png',
      purchasePrice: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artist: { name: 'da Vinci' },
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
      purchaseHistory: [],
    };
  });
  afterEach(async () => {
    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
  });
  it('sets the status to in progress, begins decreasing the time left, and calls endAuction', async () => {
    const floor = new AuctionFloor(
      nanoid(),
      testArtwork,
      3,
      { player: undefined, bid: 0 },
      [],
      [player2],
      player,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decreaseAuctionTimeLeftSpy = jest.spyOn(floor as any, '_decreaseAuctionTimeLeft');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const endAuctionSpy = jest.spyOn(floor as any, '_endAuction');

    floor.startAuction();

    expect(floor.status).toEqual('IN_PROGRESS');

    // eslint-disable-next-line no-promise-executor-return
    await new Promise(res => setTimeout(res, 5000));
    expect(decreaseAuctionTimeLeftSpy).toHaveBeenCalledTimes(3);
    expect(endAuctionSpy).toHaveBeenCalledTimes(1);
    expect(floor.timeLeft).toBe(0);
  }, 10000000);
});
