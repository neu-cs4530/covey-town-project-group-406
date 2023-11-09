import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { Artwork, TownEmitter } from '../types/CoveyTownSocket';
import ArtworkDAO from './ArtworkDAO';
import Player from '../lib/Player';

const testArtwork: Artwork = {
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
const testArtwork2: Artwork = {
  description: 'Its stary night',
  id: 2,
  primaryImage: 'starynight.png',
  purchasePrice: 100000000000,
  department: 'unknown',
  title: 'Stary Night',
  culture: 'unknown',
  period: '1800',
  artist: { name: 'Van Gogh' },
  medium: 'Canvas',
  countryOfOrigin: 'France',
  isBeingAuctioned: false,
  purchaseHistory: [],
};

const testArtwork3: Artwork = {
  description: 'Its the Last Supper',
  id: 3,
  primaryImage: 'lastsupper.png',
  purchasePrice: 2,
  department: 'unknown',
  title: 'The Last Supper',
  culture: 'unkown',
  period: '1400',
  artist: { name: 'Da Vinci' },
  medium: 'Canvas',
  countryOfOrigin: 'Italy',
  isBeingAuctioned: false,
  purchaseHistory: [],
};
const dao = new ArtworkDAO();

describe('when adding artwork to an auction house', () => {
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('adds non-conflict art proplery', async () => {
    await dao.addArtworksToAuctionHouse([testArtwork, testArtwork2]);
    const resultArray = await dao.getAllAuctionHouseArtworks();
    expect(resultArray).toContainEqual(testArtwork);
    expect(resultArray).toContainEqual(testArtwork2);
    expect(resultArray).toHaveLength(2);
    const ids = await dao.getAllArtworkIDs();
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(ids).toHaveLength(2);
  });
  it('throws an error when duplicate artwork is added', async () => {
    await dao.addArtworksToAuctionHouse([testArtwork]);
    await dao.addArtworksToAuctionHouse([testArtwork2]);
    await expect(dao.addArtworksToAuctionHouse([testArtwork])).rejects.toThrowError();
  });
});

describe('when adding a player', () => {
  let player: Player;
  let player2: Player;

  beforeEach(() => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');

    player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
  });

  it('adds the player correctly and initialzes their fields properly', async () => {
    await dao.addPlayer(player.email);
    const playerResponse = await dao.getPlayer(player.email);
    expect(playerResponse.isLoggedIn).toBe(false);
    expect(playerResponse.money).toBe(1_000_000);
    expect(playerResponse.artworks).toEqual([]);
    await dao.removePlayer(player.email);
  });
  it('does not let two users sign up with the same email', async () => {
    await dao.addPlayer(player.email);
    await expect(dao.addPlayer(player.email)).rejects.toThrowError();
    await dao.removePlayer(player.email);
  });
});

describe('when trying to add artworks to a player', () => {
  let player: Player;
  beforeEach(() => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
  });
  it('adds artwork to a player properly', async () => {
    await dao.addPlayer(player.email);
    await dao.addArtworksToPlayer(player.email, [testArtwork, testArtwork2, testArtwork3]);
    const playerResponse = await dao.getPlayer(player.email);
    const playerArtworks = playerResponse.artworks;
    expect(playerArtworks).toContainEqual(testArtwork);
    expect(playerArtworks).toContainEqual(testArtwork2);
    expect(playerArtworks).toContainEqual(testArtwork3);
    expect(playerArtworks).toHaveLength(3);
    await dao.removePlayer(player.email);
  });
});

describe('when updating a player fields', () => {
  let player: Player;
  beforeEach(() => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
  });
  it('updates the fields properly', async () => {
    await dao.addPlayer(player.email);
    await dao.updatePlayer(player.email, true, 50);
    const playerResponse = await dao.getPlayer(player.email);
    expect(playerResponse.isLoggedIn).toBe(true);
    expect(playerResponse.money).toBe(50);
    await dao.removePlayer(player.email);
  });
});

describe('when keeping track of all of the artwork IDs', () => {
  it('does not duplicate anything and keeps track properly', async () => {
    await dao.addArtworksToAuctionHouse([testArtwork, testArtwork2]);
    await dao.addArtworksToAuctionHouse([testArtwork3]);
    const idResponse = await dao.getAllArtworkIDs();
    expect(idResponse).toContain(1);
    expect(idResponse).toContain(2);
    expect(idResponse).toContain(3);
    expect(idResponse).toHaveLength(3);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});

describe('when updating an auction house artwork', () => {
  it('updates the artwork properly', async () => {
    const artworkWithUpdatedFields: Artwork = {
      description: 'test',
      id: 1,
      primaryImage: 'test',
      purchasePrice: 500000,
      department: 'test',
      title: 'test test test',
      culture: 'test',
      period: 'test',
      artist: { name: 'test test' },
      medium: 'test',
      countryOfOrigin: 'test',
      isBeingAuctioned: true,
      purchaseHistory: [],
    };
    await dao.addArtworksToAuctionHouse([testArtwork, testArtwork2, testArtwork3]);
    await dao.updateAuctionHouseArtworkByID(artworkWithUpdatedFields);
    const artworkResponse = await dao.getAllAuctionHouseArtworks();
    expect(artworkResponse).toContainEqual(artworkWithUpdatedFields);
    expect(artworkResponse).toContainEqual(testArtwork2);
    expect(artworkResponse).toContainEqual(testArtwork3);
    expect(artworkResponse).toHaveLength(3);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('throws an error when no artwork with the given id is found', async () => {
    await dao.addArtworksToAuctionHouse([testArtwork]);
    await expect(dao.updateAuctionHouseArtworkByID(testArtwork2)).rejects.toThrowError();
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});

describe('when updating a players artwork', () => {
  let player: Player;
  beforeEach(() => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
  });
  it('updates the artwork properly', async () => {
    const artworkWithUpdatedFields: Artwork = {
      description: 'test',
      id: 1,
      primaryImage: 'test',
      purchasePrice: 500000,
      department: 'test',
      title: 'test test test',
      culture: 'test',
      period: 'test',
      artist: { name: 'test test' },
      medium: 'test',
      countryOfOrigin: 'test',
      isBeingAuctioned: true,
      purchaseHistory: [],
    };
    await dao.addPlayer(player.email);
    await dao.addArtworksToPlayer(player.email, [testArtwork, testArtwork2, testArtwork3]);
    await dao.updatePlayerArtworkById(player.email, artworkWithUpdatedFields);
    const playerResponse = await dao.getPlayer(player.email);
    const { artworks } = playerResponse;
    expect(artworks).toContainEqual(artworkWithUpdatedFields);
    expect(artworks).toContainEqual(testArtwork2);
    expect(artworks).toContainEqual(testArtwork3);
    expect(artworks).toHaveLength(3);
    await dao.removePlayer(player.email);
  });
  it('throws an error if player does not have artwork', async () => {
    const artworkWithUpdatedFields = {
      description: 'test',
      id: 1,
      primaryImage: 'test',
      purchasePrice: 500000,
      department: 'test',
      title: 'test test test',
      culture: 'test',
      period: 'test',
      artist: { name: 'test test' },
      medium: 'test',
      countryOfOrigin: 'test',
      isBeingAuctioned: true,
      purchaseHistory: [],
    };
    await dao.addPlayer(player.email);
    await dao.addArtworksToPlayer(player.email, [testArtwork2]);
    await expect(
      dao.updatePlayerArtworkById(player.email, artworkWithUpdatedFields),
    ).rejects.toThrowError();
    await dao.removePlayer(player.email);
  });
});

describe('when removing artwork from a player', () => {
  let player: Player;
  beforeEach(() => {
    player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
  });
  it('removes the artwork properly', async () => {
    await dao.addPlayer(player.email);
    await dao.addArtworksToPlayer(player.email, [testArtwork, testArtwork2, testArtwork3]);
    await dao.removeArtworkFromPlayerById(player.email, testArtwork2.id);
    const playerResponse = await dao.getPlayer(player.email);
    const { artworks } = playerResponse;
    expect(artworks).toContainEqual(testArtwork);
    expect(artworks).toContainEqual(testArtwork3);
    expect(artworks).toHaveLength(2);
    await dao.removePlayer(player.email);
  });
  it('throws an error if the player does not have the artwork', async () => {
    await dao.addPlayer(player.email);
    await dao.addArtworksToPlayer(player.email, [testArtwork]);
    await expect(
      dao.removeArtworkFromPlayerById(player.email, testArtwork2.id),
    ).rejects.toThrowError();
    await dao.removePlayer(player.email);
  });
});

describe('when removing artwork from the auction house', () => {
  it('removes the artwork properly', async () => {
    await dao.addArtworksToAuctionHouse([testArtwork, testArtwork2, testArtwork3]);
    await dao.removeArtworkFromAuctionHouseById(testArtwork2.id);
    const auctionHouseArtworksResponse = await dao.getAllAuctionHouseArtworks();
    expect(auctionHouseArtworksResponse).toContainEqual(testArtwork);
    expect(auctionHouseArtworksResponse).toContainEqual(testArtwork3);
    expect(auctionHouseArtworksResponse).toHaveLength(2);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});
