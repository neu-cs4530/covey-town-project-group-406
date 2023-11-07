import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import ArtworkDAO from '../../db/ArtworkDAO';
import { TownEmitter } from '../../types/CoveyTownSocket';
import Player from '../../lib/Player';
import AuctionHouse from './AuctionHouse';
import { Artwork } from '../../types/Artwork';

const dao = new ArtworkDAO();

const testArtwork = {
  description: 'Its the Mona Lisa',
  id: 1,
  primaryImage: 'monalisa.png',
  current_price: 500000,
  department: 'unknown',
  title: 'The mona lisa',
  culture: 'unknown',
  period: '1500',
  artistDisplayName: 'da Vinci',
  medium: 'Canvas',
  countryOfOrigin: 'Italy',
  isBeingAuctioned: false,
};

const testArtwork2 = {
  description: 'Its stary night',
  id: 2,
  primaryImage: 'starynight.png',
  current_price: 100000000000,
  department: 'unknown',
  title: 'Stary Night',
  culture: 'unknown',
  period: '1800',
  artistDisplayName: 'Van Gogh',
  medium: 'Canvas',
  countryOfOrigin: 'France',
  isBeingAuctioned: false,
};

const seller = new Player(nanoid(), mock<TownEmitter>());
seller.email = 'seller@gmail.com';
const bidder = new Player(nanoid(), mock<TownEmitter>());
bidder.email = 'bidder@gmail.com';
const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
let auctionHouse: AuctionHouse;

describe('Testing adding floors to auction house', () => {
  let newAuctionHouse: AuctionHouse;
  beforeEach(async () => {
    newAuctionHouse = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    AuctionHouse.artworkToBeAuctioned = [];
    await dao.removeArtworkIDList();
  });
  afterEach(async () => {
    await dao.removeArtworkIDList();
    AuctionHouse.artworkToBeAuctioned = [];
  });
  it('Adds a non-player floor to the auction house properly', async () => {
    await newAuctionHouse.setAuctionHouseArtworks([testArtwork2]);

    await newAuctionHouse.createNewAuctionFloorNonPlayer();

    expect(newAuctionHouse.auctionFloors).toHaveLength(1);
    expect(newAuctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork2);
    expect(newAuctionHouse.auctionFloors[0].auctioneer).toBeUndefined();
    expect(newAuctionHouse.auctionFloors[0].status).toEqual('WAITING_TO_START');

    await dao.removeAuctionHouse();
    testArtwork2.isBeingAuctioned = false;
  });
  it('Adds a player-created floor to the auction house properly', async () => {
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, testArtwork);
    seller.addArtwork(testArtwork);

    await newAuctionHouse.createNewAuctionFloorPlayer(seller, testArtwork);

    expect(newAuctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);
    expect(newAuctionHouse.auctionFloors[0].auctioneer).toEqual(seller);
    expect(seller.artwork).toEqual([testArtwork]);
    expect(newAuctionHouse.auctionFloors[0].status).toEqual('WAITING_TO_START');

    await dao.removePlayer(seller.email);
    testArtwork.isBeingAuctioned = false;
  });

  it('Throws an error if the player does not have the artwork in their inventory and tries to create a floor with it', async () => {
    await dao.addPlayer(seller.email);
    seller.removeArtwork(testArtwork);

    await expect(() =>
      newAuctionHouse.createNewAuctionFloorPlayer(seller, testArtwork),
    ).rejects.toThrowError('player does not have artwork with id');

    await dao.removePlayer(seller.email);
    testArtwork.isBeingAuctioned = false;
  });
});

describe('Testing joining floors properly', () => {
  beforeEach(async () => {
    await dao.removeArtworkIDList();
    auctionHouse = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    AuctionHouse.artworkToBeAuctioned = [];
  });
  afterEach(async () => {
    await dao.removeArtworkIDList();
    AuctionHouse.artworkToBeAuctioned = [];
  });
  it('Allows a player to join as an observer properly', async () => {
    await auctionHouse.setAuctionHouseArtworks([testArtwork2]);

    await auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.joinFloorAsObserver(bidder, auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors[0].observers[0]).toEqual(bidder);
    expect(auctionHouse.auctionFloors[0].bidders).toHaveLength(0);

    await dao.removeAuctionHouse();
    testArtwork2.isBeingAuctioned = false;
  });
  it('Allows a player to join as a bidder properly', async () => {
    await auctionHouse.setAuctionHouseArtworks([testArtwork]);

    await auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.joinFloorAsBidder(bidder, auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors[0].bidders[0]).toEqual(bidder);
    expect(auctionHouse.auctionFloors[0].observers).toHaveLength(0);

    await dao.removeAuctionHouse();
    testArtwork.isBeingAuctioned = false;
  });
  it('Throws an error if the floor does not exist', () => {
    expect(() => auctionHouse.joinFloorAsBidder(bidder, nanoid())).toThrowError(
      'no floor with ID found',
    );
    expect(() => auctionHouse.joinFloorAsObserver(bidder, nanoid())).toThrowError(
      'no floor with ID found',
    );
  });
});

describe('Testing delete floor and reset floor functionality', () => {
  beforeEach(async () => {
    auctionHouse = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    AuctionHouse.artworkToBeAuctioned = [];
    await dao.removeArtworkIDList();
    await auctionHouse.setAuctionHouseArtworks([testArtwork, testArtwork2]);
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
    AuctionHouse.artworkToBeAuctioned = [];
  });
  it('Deletes a player-owned floor from the auction house', async () => {
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, testArtwork);
    seller.addArtwork(testArtwork);
    await auctionHouse.createNewAuctionFloorPlayer(seller, testArtwork);

    expect(auctionHouse.auctionFloors).toHaveLength(1);

    await auctionHouse.deleteAuctionFloor(auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors).toHaveLength(0);

    await dao.removePlayer(seller.email);
    seller.removeArtwork(testArtwork);
    testArtwork.isBeingAuctioned = false;
  });
  it('Resets an auction-house owned floor when there is no winner', async () => {
    await auctionHouse.createNewAuctionFloorNonPlayer();

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);

    await auctionHouse.resetAuctionFloor(auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.auctionFloors[0].currentBid.bid).toBe(0);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);
    testArtwork.isBeingAuctioned = false;
  });
  it('Resets an auction-house owned floor when there is a winner', async () => {
    await auctionHouse.createNewAuctionFloorNonPlayer();

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(AuctionHouse.artworkToBeAuctioned).toHaveLength(2);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);

    auctionHouse.auctionFloors[0].currentBid = { player: seller, bid: 10 };
    await auctionHouse.resetAuctionFloor(auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.auctionFloors[0].currentBid.bid).toBe(0);
    expect(auctionHouse.auctionFloors[0].status).toBe('WAITING_TO_START');
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork2);
    expect(AuctionHouse.artworkToBeAuctioned).toEqual([testArtwork2]);
    testArtwork.isBeingAuctioned = false;
    testArtwork2.isBeingAuctioned = false;
  });
  it('Throws an error if no floor exists with ID given to delete', async () => {
    await expect(async () => auctionHouse.deleteAuctionFloor(nanoid())).rejects.toThrowError(
      'no floor with id found',
    );
  });
  it('Throws an error if no floor exists with ID given to reset', async () => {
    await expect(async () => auctionHouse.resetAuctionFloor(nanoid())).rejects.toThrowError(
      'no floor with id found',
    );
  });
});

describe('When a floor emits an auction ended event', () => {
  let art: Artwork;
  let artNo: Artwork;
  let artYes: Artwork;

  let art2: Artwork;
  let artNo2: Artwork;
  let artYes2: Artwork;
  beforeEach(async () => {
    art = {
      description: 'Its the Mona Lisa',
      id: 1,
      primaryImage: 'monalisa.png',
      current_price: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artistDisplayName: 'da Vinci',
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
    };
    artNo = {
      description: 'Its the Mona Lisa',
      id: 1,
      primaryImage: 'monalisa.png',
      current_price: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artistDisplayName: 'da Vinci',
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
    };
    artYes = {
      description: 'Its the Mona Lisa',
      id: 1,
      primaryImage: 'monalisa.png',
      current_price: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artistDisplayName: 'da Vinci',
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: true,
    };
    art2 = {
      description: 'Its the Mona Lisa',
      id: 2,
      primaryImage: 'monalisa.png',
      current_price: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artistDisplayName: 'da Vinci',
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
    };
    artNo2 = {
      description: 'Its the Mona Lisa',
      id: 2,
      primaryImage: 'monalisa.png',
      current_price: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artistDisplayName: 'da Vinci',
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
    };
    artYes2 = {
      description: 'Its the Mona Lisa',
      id: 2,
      primaryImage: 'monalisa.png',
      current_price: 500000,
      department: 'unknown',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artistDisplayName: 'da Vinci',
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: true,
    };
    bidder.artwork = [];
    seller.artwork = [];
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, art);
    seller.addArtwork(art);

    await dao.addPlayer(bidder.email);

    auctionHouse = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    AuctionHouse.artworkToBeAuctioned = [];
    await dao.removeArtworkIDList();
    await auctionHouse.setAuctionHouseArtworks([art, art2]);
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removePlayer(bidder.email);
    await dao.removePlayer(seller.email);
    await dao.removeArtworkIDList();
    AuctionHouse.artworkToBeAuctioned = [];
    bidder.artwork = [];
    seller.artwork = [];
  });

  it('Removes the floor when it is a user-created floor and ', async () => {
    await auctionHouse.createNewAuctionFloorPlayer(seller, art);
    auctionHouse.auctionFloors[0].currentBid = { player: bidder, bid: 10 };
    auctionHouse.auctionFloors[0].timeLeft = 1;

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([artYes]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(seller.artwork).toEqual([artYes]);
    expect(bidder.artwork).toEqual([]);

    auctionHouse.auctionFloors[0].startAuction();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(res => setTimeout(res, 5000));

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([artNo]);
    expect(seller.artwork).toEqual([]);
    expect(bidder.artwork).toEqual([artNo]);
    expect(auctionHouse.auctionFloors).toHaveLength(0);
  }, 10000);
  it('Resets the floor when it is a auction-house created floor, adds artwork to player', async () => {
    await auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.auctionFloors[0].currentBid = { player: bidder, bid: 10 };
    auctionHouse.auctionFloors[0].timeLeft = 1;

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([artYes, artNo2]);
    expect(AuctionHouse.artworkToBeAuctioned).toEqual([artYes, artNo2]);
    expect(bidder.artwork).toEqual([]);

    auctionHouse.auctionFloors[0].startAuction();

    // eslint-disable-next-line no-promise-executor-return
    await new Promise(res => setTimeout(res, 5000));

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([artNo]);
    expect(bidder.artwork).toEqual([artNo]);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(artYes2);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([artYes2]);
  }, 10000);

  it('Resets the floor when it is a auction-house created floor, does not add artwork to player if no bid', async () => {
    await auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.joinFloorAsBidder(bidder, auctionHouse.auctionFloors[0].id);
    auctionHouse.auctionFloors[0].timeLeft = 1;

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([artYes, artNo2]);
    expect(AuctionHouse.artworkToBeAuctioned).toEqual([artYes, artNo2]);
    expect(bidder.artwork).toEqual([]);

    auctionHouse.auctionFloors[0].startAuction();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(res => setTimeout(res, 5000));

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(bidder.artwork).toEqual([]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([artYes, artNo2]);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(artYes);
  }, 10000);

  it('In a player created room, the room is removed and no artwork exchange in player created room', async () => {
    await auctionHouse.createNewAuctionFloorPlayer(seller, art);
    auctionHouse.auctionFloors[0].timeLeft = 1;

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([artYes]);
    expect(seller.artwork).toEqual([artYes]);

    expect(bidder.artwork).toEqual([]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);

    auctionHouse.auctionFloors[0].startAuction();
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(res => setTimeout(res, 8000));

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([artNo]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(seller.artwork).toEqual([artNo]);
    expect(bidder.artwork).toEqual([]);
    expect(auctionHouse.auctionFloors).toHaveLength(0);
  }, 100000);
});
