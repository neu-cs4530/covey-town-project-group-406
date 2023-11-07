import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import Player from '../../lib/Player';
import { TownEmitter } from '../../types/CoveyTownSocket';
import ArtworkDAO from '../../db/ArtworkDAO';
import AuctionFloor from './AuctionFloor';

const dao = new ArtworkDAO();

const testArtwork = {
  description: 'Its the Mona Lisa',
  id: 1,
  primaryImage: 'monalisa.png',
  purchasePrice: 500000,
  department: 'unknown',
  title: 'The mona lisa',
  culture: 'unknown',
  period: '1500',
  artistDisplayName: 'da Vinci',
  medium: 'Canvas',
  countryOfOrigin: 'Italy',
  isBeingAuctioned: false,
  purchaseHistory: [],
};
const testArtwork2 = {
  description: 'Its stary night',
  id: 2,
  primaryImage: 'starynight.png',
  purchasePrice: 100000000000,
  department: 'unknown',
  title: 'Stary Night',
  culture: 'unknown',
  period: '1800',
  artistDisplayName: 'Van Gogh',
  medium: 'Canvas',
  countryOfOrigin: 'France',
  isBeingAuctioned: false,
  purchaseHistory: [],
};

let auctionFloorPlayerOwned: AuctionFloor;
let auctionFloorHouseOwned: AuctionFloor;
let seller: Player;
let bidder: Player;
describe('testing emitAuctionEndEvent', () => {
  beforeAll(() => {
    seller = new Player(nanoid(), mock<TownEmitter>());
    auctionFloorPlayerOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
      seller,
    );
    auctionFloorHouseOwned = new AuctionFloor(
      nanoid(),
      testArtwork2,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
    );
  });
  it('Emits event when house owns the auction floor', () => {
    let x = -1;
    auctionFloorHouseOwned.on('auctionEnded', f => {
      x = 1;
    });
    auctionFloorHouseOwned.emitAuctionEndEvent();
    expect(x).toBe(1);
  });
  it('Emits event when player owns the auction floor', () => {
    let x = -1;
    auctionFloorPlayerOwned.on('auctionEnded', f => {
      x = 1;
    });
    auctionFloorPlayerOwned.emitAuctionEndEvent();
    expect(x).toBe(1);
  });
});

describe('testing giveArtworkToPlayer', () => {
  beforeAll(async () => {
    bidder = new Player(nanoid(), mock<TownEmitter>());
    bidder.email = 'bidder@gmail.com';
    await dao.addPlayer(bidder.email);

    seller = new Player(nanoid(), mock<TownEmitter>());
    seller.email = 'seller@gmail.com';
    await dao.addPlayer(seller.email);

    auctionFloorPlayerOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
      seller,
    );
  });
  afterAll(async () => {
    await dao.removePlayer(bidder.email);
    await dao.removePlayer(seller.email);
  });
  it('Gives the artwork to the player who made the bid', async () => {
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(bidder.artwork).toEqual([]);

    auctionFloorPlayerOwned.currentBid = { player: bidder, bid: 0 };
    await auctionFloorPlayerOwned.giveArtworkToPlayer();

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([testArtwork]);
    expect(bidder.artwork).toEqual([testArtwork]);
  });
});

describe('testing removeArtworkFromPlayer and removeArtworkFromAuctionHouse', () => {
  beforeAll(async () => {
    bidder = new Player(nanoid(), mock<TownEmitter>());
    bidder.email = 'bidder@gmail.com';
    await dao.addPlayer(bidder.email);

    seller = new Player(nanoid(), mock<TownEmitter>());
    seller.email = 'seller@gmail.com';
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, testArtwork);
    seller.addArtwork(testArtwork);

    auctionFloorPlayerOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
      seller,
    );
    auctionFloorHouseOwned = new AuctionFloor(
      nanoid(),
      testArtwork2,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
    );

    await dao.setAuctionHouseArtworks([testArtwork2]);
  });
  afterAll(async () => {
    await dao.removePlayer(bidder.email);
    await dao.removePlayer(seller.email);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('Removes the artwork properly from the seller if seller is player', async () => {
    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([testArtwork]);
    expect(seller.artwork).toEqual([testArtwork]);

    await auctionFloorPlayerOwned.removeArtworkFromPlayer();

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([]);
    expect(seller.artwork).toEqual([]);
  });
});

describe('testing setAuctionTime', () => {
  beforeAll(() => {
    auctionFloorPlayerOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
      seller,
    );
  });
  it('Sets the time properly', () => {
    auctionFloorPlayerOwned.timeLeft = 30;
    expect(auctionFloorPlayerOwned.timeLeft).toBe(30);
  });
});

describe('testing decreaseAuctionTimeLeft', () => {
  beforeAll(() => {
    auctionFloorPlayerOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      30,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
      seller,
    );
  });
  it('Decreases time and emits event properly', () => {
    auctionFloorPlayerOwned.on('timeDecreased', t => {
      expect(t).toBe(29);
    });
    auctionFloorPlayerOwned.timeLeft = 30;
    auctionFloorPlayerOwned.decreaseAuctionTimeLeft();
  });
});

describe('testing endAuction', () => {
  beforeEach(async () => {
    await dao.removeArtworkIDList();
    bidder = new Player(nanoid(), mock<TownEmitter>());
    bidder.email = 'bidder@gmail.com';
    await dao.addPlayer(bidder.email);

    seller = new Player(nanoid(), mock<TownEmitter>());
    seller.email = 'seller@gmail.com';
    await dao.addPlayer(seller.email);
    seller.addArtwork(testArtwork);

    await dao.addArtworkToPlayer(seller.email, testArtwork);
    auctionFloorPlayerOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      30,
      {
        player: bidder,
        bid: 10,
      },
      [],
      [],
      seller,
    );
    auctionFloorHouseOwned = new AuctionFloor(
      nanoid(),
      testArtwork2,
      30,
      {
        player: bidder,
        bid: 10,
      },
      [],
      [],
    );

    await dao.setAuctionHouseArtworks([]);
    await dao.addArtworkToAuctionHouse(testArtwork2);
  });
  afterEach(async () => {
    await dao.removePlayer(bidder.email);
    await dao.removePlayer(seller.email);
    seller.removeArtwork(testArtwork);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });

  it('Removes artwork from player when there is a Bid and auction ends', async () => {
    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([testArtwork]);
    expect(seller.artwork).toEqual([testArtwork]);

    await auctionFloorPlayerOwned.endAuction();

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([]);
    expect(seller.artwork).toEqual([]);
  });
  it('Gives artwork to player who made the bid and auction ends', async () => {
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    auctionFloorPlayerOwned.currentBid = { player: bidder, bid: 10 };

    await auctionFloorPlayerOwned.endAuction();

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([testArtwork]);
    expect(bidder.artwork).toEqual([testArtwork]);
  });
  it('Emits the auction ended event', async () => {
    auctionFloorPlayerOwned.on('auctionEnded', (f: AuctionFloor) => {
      expect(f.artBeingAuctioned).toEqual(testArtwork);
    });
    await auctionFloorPlayerOwned.endAuction();
  });
});

describe('testing startAuction', () => {
  beforeAll(async () => {
    auctionFloorHouseOwned = new AuctionFloor(
      nanoid(),
      testArtwork,
      2,
      {
        player: undefined,
        bid: 0,
      },
      [],
      [],
    );
  });
  it('decreases the time every second, and emits timeDecreased. It also ends the interval and calls endAuction', () => {
    jest.useFakeTimers();
    const spy = jest.spyOn(auctionFloorHouseOwned, 'decreaseAuctionTimeLeft');
    const endAuctionSpy = jest.spyOn(auctionFloorHouseOwned, 'endAuction');
    auctionFloorHouseOwned.startAuction();
    jest.advanceTimersByTime(3000);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(endAuctionSpy).toHaveBeenCalledTimes(1);
  });
});
