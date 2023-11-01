import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import ArtworkDAO from '../../db/ArtworkDAO';
import { TownEmitter } from '../../types/CoveyTownSocket';
import Player from '../../lib/Player';
import AuctionHouse from './AuctionHouse';

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
  });
  afterEach(() => {});
  it('Adds a non-player floor to the auction house properly', async () => {
    await newAuctionHouse.setAuctionHouseArtworks([testArtwork2]);

    newAuctionHouse.createNewAuctionFloorNonPlayer();

    expect(newAuctionHouse.auctionFloors).toHaveLength(1);
    expect(newAuctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork2);
    expect(newAuctionHouse.auctionFloors[0].auctioneer).toBeUndefined();
    expect(newAuctionHouse.indexOfArtToBeAuctioned).toBe(1);
    expect(newAuctionHouse.auctionFloors[0].status).toEqual('WAITING_TO_START');

    await dao.removeAuctionHouse();
  });
  it('Adds a player-created floor to the auction house properly', async () => {
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, testArtwork);
    seller.addArtwork(testArtwork);

    newAuctionHouse.createNewAuctionFloorPlayer(seller, testArtwork);

    expect(newAuctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);
    expect(newAuctionHouse.auctionFloors[0].auctioneer).toEqual(seller);
    expect(seller.artwork).toEqual([testArtwork]);
    expect(newAuctionHouse.indexOfArtToBeAuctioned).toBe(0);
    expect(newAuctionHouse.auctionFloors[0].status).toEqual('WAITING_TO_START');

    await dao.removePlayer(seller.email);
  });

  it('Throws an error if the player does not have the artwork in their inventory and tries to create a floor with it', async () => {
    await dao.addPlayer(seller.email);
    seller.removeArtwork(testArtwork);

    expect(() => newAuctionHouse.createNewAuctionFloorPlayer(seller, testArtwork)).toThrowError(
      'player does not have artwork with id',
    );

    await dao.removePlayer(seller.email);
  });
});

describe('Testing joining floors properly', () => {
  beforeEach(() => {
    auctionHouse = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
  });
  it('Allows a player to join as an observer properly', async () => {
    await auctionHouse.setAuctionHouseArtworks([testArtwork2]);

    auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.joinFloorAsObserver(bidder, auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors[0].observers[0]).toEqual(bidder);
    expect(auctionHouse.auctionFloors[0].bidders).toHaveLength(0);

    await dao.removeAuctionHouse();
  });
  it('Allows a player to join as a bidder properly', async () => {
    await auctionHouse.setAuctionHouseArtworks([testArtwork]);

    auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.joinFloorAsBidder(bidder, auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors[0].bidders[0]).toEqual(bidder);
    expect(auctionHouse.auctionFloors[0].observers).toHaveLength(0);

    await dao.removeAuctionHouse();
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
    await auctionHouse.setAuctionHouseArtworks([testArtwork, testArtwork2]);
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
  });
  it('Deletes a player-owned floor from the auction house', async () => {
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, testArtwork);
    seller.addArtwork(testArtwork);
    auctionHouse.createNewAuctionFloorPlayer(seller, testArtwork);

    expect(auctionHouse.auctionFloors).toHaveLength(1);

    auctionHouse.deleteAuctionFloor(auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors).toHaveLength(0);

    await dao.removePlayer(seller.email);
    seller.removeArtwork(testArtwork);
  });
  it('Resets an auction-house owned floor when there is no winner', async () => {
    auctionHouse.createNewAuctionFloorNonPlayer();

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.indexOfArtToBeAuctioned).toBe(1);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);

    await auctionHouse.resetAuctionFloor(auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.auctionFloors[0].currentBid.bid).toBe(0);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);
    expect(auctionHouse.indexOfArtToBeAuctioned).toBe(1);
  });
  it('Resets an auction-house owned floor when there is a winner', async () => {
    auctionHouse.createNewAuctionFloorNonPlayer();

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.artworkToBeAuctioned).toHaveLength(2);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork);

    auctionHouse.auctionFloors[0].currentBid = { player: seller, bid: 10 };
    await auctionHouse.resetAuctionFloor(auctionHouse.auctionFloors[0].id);

    expect(auctionHouse.auctionFloors).toHaveLength(1);
    expect(auctionHouse.auctionFloors[0].currentBid.bid).toBe(0);
    expect(auctionHouse.auctionFloors[0].status).toBe('WAITING_TO_START');
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork2);
    expect(auctionHouse.indexOfArtToBeAuctioned).toBe(1);
    expect(auctionHouse.artworkToBeAuctioned).toEqual([testArtwork2]);
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
  beforeEach(async () => {
    bidder.artwork = [];
    seller.artwork = [];
    await dao.addPlayer(seller.email);
    await dao.addArtworkToPlayer(seller.email, testArtwork);
    seller.addArtwork(testArtwork);

    await dao.addPlayer(bidder.email);

    auctionHouse = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await auctionHouse.setAuctionHouseArtworks([testArtwork2, testArtwork]);
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removePlayer(bidder.email);
    await dao.removePlayer(seller.email);
    bidder.artwork = [];
    seller.artwork = [];
  });

  it('Removes the floor when it is a user-created floor and ', async () => {
    auctionHouse.createNewAuctionFloorPlayer(seller, testArtwork);
    auctionHouse.auctionFloors[0].currentBid = { player: bidder, bid: 10 };

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([testArtwork]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(seller.artwork).toEqual([testArtwork]);
    expect(bidder.artwork).toEqual([]);

    await auctionHouse.auctionFloors[0].endAuction();

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([testArtwork]);
    expect(seller.artwork).toEqual([]);
    expect(bidder.artwork).toEqual([testArtwork]);
    expect(auctionHouse.auctionFloors).toHaveLength(0);
  });
  it('Resets the floor when it is a auction-house created floor, adds artwork to player', async () => {
    auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.auctionFloors[0].currentBid = { player: bidder, bid: 10 };

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork2, testArtwork]);
    expect(auctionHouse.artworkToBeAuctioned).toEqual([testArtwork2, testArtwork]);
    expect(bidder.artwork).toEqual([]);

    jest
      .spyOn(auctionHouse.auctionFloors[0], 'emitAuctionEndEvent')
      .mockImplementation(async () => {
        await auctionHouse.resetAuctionFloor(auctionHouse.auctionFloors[0].id);
      });

    await auctionHouse.auctionFloors[0].endAuction();

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([testArtwork2]);
    expect(bidder.artwork).toEqual([testArtwork2]);

    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork]);
    expect(auctionHouse.artworkToBeAuctioned).toEqual([testArtwork]);
  });

  it('Resets the floor when it is a auction-house created floor, does not add artwork to player if no bid', async () => {
    auctionHouse.createNewAuctionFloorNonPlayer();
    auctionHouse.joinFloorAsBidder(bidder, auctionHouse.auctionFloors[0].id);

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork2, testArtwork]);
    expect(auctionHouse.artworkToBeAuctioned).toEqual([testArtwork2, testArtwork]);
    expect(bidder.artwork).toEqual([]);

    jest
      .spyOn(auctionHouse.auctionFloors[0], 'emitAuctionEndEvent')
      .mockImplementation(async () => {
        await auctionHouse.resetAuctionFloor(auctionHouse.auctionFloors[0].id);
      });

    await auctionHouse.auctionFloors[0].endAuction();

    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(bidder.artwork).toEqual([]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork2, testArtwork]);
    expect(auctionHouse.artworkToBeAuctioned).toEqual([testArtwork2, testArtwork]);
    expect(auctionHouse.auctionFloors[0].artBeingAuctioned).toEqual(testArtwork2);
  });

  it('In a player created room, the room is removed and no artwork exchange in player created room', async () => {
    auctionHouse.createNewAuctionFloorPlayer(seller, testArtwork);

    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([testArtwork]);
    expect(seller.artwork).toEqual([testArtwork]);

    expect(bidder.artwork).toEqual([]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);

    await auctionHouse.auctionFloors[0].endAuction();
    await expect(dao.getAllOfPlayersArtwork(seller.email)).resolves.toEqual([testArtwork]);
    await expect(dao.getAllOfPlayersArtwork(bidder.email)).resolves.toEqual([]);
    expect(seller.artwork).toEqual([testArtwork]);
    expect(bidder.artwork).toEqual([]);
    expect(auctionHouse.auctionFloors).toHaveLength(0);
  });
});
