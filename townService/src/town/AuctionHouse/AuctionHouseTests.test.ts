import { nanoid } from 'nanoid';
import { mock } from 'jest-mock-extended';
import { TownEmitter, Artwork } from '../../types/CoveyTownSocket';
import Player from '../../lib/Player';
import AuctionHouse from './AuctionHouse';
import SingletonArtworkDAO from '../../db/SingletonArtworkDAO';

const dao = SingletonArtworkDAO.instance();
const VAL1 = nanoid();
const VAL2 = nanoid();
const VAL3 = nanoid();
dao.auctionHouseCollection = VAL1;
dao.userCollection = VAL2;
dao.artworkIDsCollection = VAL3;

const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
describe('when adding artworks to the auction house', () => {
  let testArtwork: Artwork;
  let testArtwork2: Artwork;
  beforeEach(() => {
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
    testArtwork2 = {
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
  });
  it('updates the static array and database properly', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());

    await house.addArtworksToAuctionHouse([testArtwork, testArtwork2], 0);
    const auctionHouseArtworks = await dao.getAllAuctionHouseArtworks();
    const artworkIDs = await dao.getAllArtworkIDs();
    expect(auctionHouseArtworks).toContainEqual(testArtwork);
    expect(auctionHouseArtworks).toContainEqual(testArtwork2);
    expect(auctionHouseArtworks).toHaveLength(2);
    expect(artworkIDs).toContain(1);
    expect(artworkIDs).toContain(2);
    expect(artworkIDs).toHaveLength(2);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});

describe('when making a bid', () => {
  let testArtwork: Artwork;
  beforeEach(() => {
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
  it('makes the bid correctly', async () => {
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);

    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork], 0);
    await house.createNewAuctionFloorNonPlayer(1);
    house.makeBid(player, house.auctionFloors[0].id, 10);
    expect(house.auctionFloors[0].currentBid?.player).toEqual(player);
    expect(house.auctionFloors[0].currentBid?.bid).toBe(10);
    await dao.removePlayer(player.email);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('does not make a bid if the players bid is under the min bid', async () => {
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);

    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork], 0);
    await house.createNewAuctionFloorNonPlayer(100);
    house.makeBid(player, house.auctionFloors[0].id, 10);
    expect(house.auctionFloors[0].currentBid?.player).toEqual(undefined);
    expect(house.auctionFloors[0].currentBid?.bid).toBe(undefined);
    await dao.removePlayer(player.email);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('does not make a bid if the players bid is under the current bid', async () => {
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);

    const player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork], 0);
    await house.createNewAuctionFloorNonPlayer(0);
    house.auctionFloors[0].currentBid = { player: player2, bid: 1000 };
    house.makeBid(player, house.auctionFloors[0].id, 10);
    expect(house.auctionFloors[0].currentBid.player).toEqual(player2);
    expect(house.auctionFloors[0].currentBid.bid).toBe(1000);
    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});
describe('when creating a new auction floor', () => {
  jest.setTimeout(50000);
  let testArtwork: Artwork;
  let testArtworkIsBeingAuctioned: Artwork;
  let testArtwork2: Artwork;
  beforeEach(() => {
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
    testArtworkIsBeingAuctioned = {
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
      isBeingAuctioned: true,
      purchaseHistory: [],
    };
    testArtwork2 = {
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
  });
  it('creates a non-player floor correctly', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork], 0);
    await house.createNewAuctionFloorNonPlayer(1);
    expect(house.auctionFloors).toHaveLength(1);
    expect(house.auctionFloors[0].artBeingAuctioned).toEqual(testArtworkIsBeingAuctioned);
    expect(house.auctionFloors[0].artBeingAuctioned.isBeingAuctioned).toBe(true);
    const auctionHouseArtworks = await dao.getAllAuctionHouseArtworks();
    expect(auctionHouseArtworks).toHaveLength(1);
    expect(auctionHouseArtworks[0].isBeingAuctioned).toBe(true);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('creates two non-player floors back to back correctly', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork, testArtwork2], 0);
    const floorTwoArtwork = { ...AuctionHouse.artworkToBeAuctioned[1] };
    floorTwoArtwork.isBeingAuctioned = true;
    await house.createNewAuctionFloorNonPlayer(1);
    await house.createNewAuctionFloorNonPlayer(1);
    expect(house.auctionFloors).toHaveLength(2);

    expect(house.auctionFloors[1].artBeingAuctioned).toEqual(floorTwoArtwork);
    expect(house.auctionFloors[1].artBeingAuctioned.isBeingAuctioned).toBe(true);
    const auctionHouseArtworks = await dao.getAllAuctionHouseArtworks();
    expect(auctionHouseArtworks).toHaveLength(2);
    expect(auctionHouseArtworks[1].isBeingAuctioned).toBe(true);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });

  it('creates a player floor properly', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);
    await player.addArtwork(testArtwork);
    await dao.addArtworksToPlayer(player.email, [testArtwork]);

    await house.createNewAuctionFloorPlayer(player, testArtwork, 1);
    expect((player.artwork[0].isBeingAuctioned = true));
    const playerResponse = await dao.getPlayer(player.email);
    const { artworks } = playerResponse;
    expect(artworks).toHaveLength(1);
    expect(artworks[0].isBeingAuctioned).toBe(true);
    await dao.removePlayer(player.email);
  });
  it('adds new artworks to the auction house db if there are none in the db', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.createNewAuctionFloorNonPlayer(1);
    expect(house.auctionFloors.length).toBeLessThanOrEqual(30);
    expect(house.auctionFloors[0].artBeingAuctioned.isBeingAuctioned).toBe(true);
    const auctionHouseArtworks = await dao.getAllAuctionHouseArtworks();
    expect(auctionHouseArtworks.length).toBeLessThanOrEqual(30);
    const artworkBeingAuctioned = auctionHouseArtworks.find(a => a.isBeingAuctioned === true);
    expect(artworkBeingAuctioned?.isBeingAuctioned).toBe(true);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('adds new artworks to the auction house db if there are none available for auction', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtworkIsBeingAuctioned], 0);
    await house.createNewAuctionFloorNonPlayer(1);
    expect(house.auctionFloors.length).toBeLessThanOrEqual(30);
    expect(house.auctionFloors[0].artBeingAuctioned.isBeingAuctioned).toBe(true);
    const auctionHouseArtworks = await dao.getAllAuctionHouseArtworks();
    expect(auctionHouseArtworks.length).toBeLessThanOrEqual(30);
    expect(auctionHouseArtworks[0].isBeingAuctioned).toBe(true);
    const artworkBeingAuctioned = auctionHouseArtworks.find(a => a.isBeingAuctioned === true);
    expect(artworkBeingAuctioned?.isBeingAuctioned).toBe(true);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});

describe('when joining an auction floor', () => {
  let testArtwork: Artwork;
  beforeEach(() => {
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
  it('joins properly as an observer', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork], 0);
    await house.createNewAuctionFloorNonPlayer(1);
    const player = new Player(nanoid(), mock<TownEmitter>());

    house.joinFloorAsObserver(player, house.auctionFloors[0].id);
    expect(house.auctionFloors[0].observers).toContainEqual(player);
    expect(house.auctionFloors[0].bidders).toEqual([]);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('joins properly as a bidder', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    await house.addArtworksToAuctionHouse([testArtwork], 0);
    await house.createNewAuctionFloorNonPlayer(1);
    const player = new Player(nanoid(), mock<TownEmitter>());

    house.joinFloorAsBidder(player, house.auctionFloors[0].id);
    expect(house.auctionFloors[0].bidders).toContainEqual(player);
    expect(house.auctionFloors[0].observers).toEqual([]);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
});

describe('when leaving an auction floor', () => {
  let testArtwork: Artwork;

  beforeEach(() => {
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
  it('removes the player properly if they are just an observer', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);
    await player.addArtwork(testArtwork);

    const player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    await dao.addArtworksToPlayer(player.email, [testArtwork]);
    await house.createNewAuctionFloorPlayer(player, testArtwork, 1);

    house.joinFloorAsObserver(player2, house.auctionFloors[0].id);
    expect(house.auctionFloors[0].observers).toHaveLength(1);
    house.leaveAuctionFloor(player2, house.auctionFloors[0].id);
    expect(house.auctionFloors[0].observers).toHaveLength(0);

    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
  });
  it('removes the player properly if they are a bidder and their bid is not the current bid', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);
    await player.addArtwork(testArtwork);

    const player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    await dao.addArtworksToPlayer(player.email, [testArtwork]);
    await house.createNewAuctionFloorPlayer(player, testArtwork, 1);

    house.joinFloorAsBidder(player2, house.auctionFloors[0].id);
    expect(house.auctionFloors[0].bidders).toHaveLength(1);
    house.leaveAuctionFloor(player2, house.auctionFloors[0].id);
    expect(house.auctionFloors[0].bidders).toHaveLength(0);

    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
  });
  it('removes the player properly if they are a bidder and their bid is the current bid', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);
    await player.addArtwork(testArtwork);

    const player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    await dao.addArtworksToPlayer(player.email, [testArtwork]);
    await house.createNewAuctionFloorPlayer(player, testArtwork, 1);

    house.joinFloorAsBidder(player2, house.auctionFloors[0].id);
    house.makeBid(player2, house.auctionFloors[0].id, 100);

    expect(house.auctionFloors[0].bidders).toHaveLength(1);
    expect(house.auctionFloors[0].currentBid?.bid).toBe(100);
    expect(house.auctionFloors[0].currentBid?.player).toEqual(player2);

    house.leaveAuctionFloor(player2, house.auctionFloors[0].id);

    expect(house.auctionFloors[0].bidders).toHaveLength(0);
    expect(house.auctionFloors[0].currentBid).toBeUndefined();

    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
  });
  it('removes the player properly if they are the auctioneer, and removes the floor and sets artwork to not being auctioned', async () => {
    const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
    const player = new Player(nanoid(), mock<TownEmitter>());
    player.initializeArtAuctionAccount('player@gmail.com');
    await dao.addPlayer(player.email);
    await player.addArtwork(testArtwork);

    const player2 = new Player(nanoid(), mock<TownEmitter>());
    player2.initializeArtAuctionAccount('player2@gmail.com');
    await dao.addPlayer(player2.email);

    await dao.addArtworksToPlayer(player.email, [testArtwork]);
    await house.createNewAuctionFloorPlayer(player, testArtwork, 1);

    house.joinFloorAsBidder(player2, house.auctionFloors[0].id);

    expect(house.auctionFloors).toHaveLength(1);
    expect(player.artwork[0].isBeingAuctioned).toBe(true);
    const dbPlayer = await dao.getPlayer(player.email);
    const dbPlayerArtworks = dbPlayer.artworks;
    expect(dbPlayerArtworks[0].isBeingAuctioned).toBe(true);

    await house.leaveAuctionFloor(player, house.auctionFloors[0].id);

    expect(house.auctionFloors).toHaveLength(0);
    expect(player.artwork[0].isBeingAuctioned).toBe(false);
    const dbPlayer2 = await dao.getPlayer(player.email);
    const dbPlayerArtworks2 = dbPlayer2.artworks;
    expect(dbPlayerArtworks2[0].isBeingAuctioned).toBe(false);

    await dao.removePlayer(player.email);
    await dao.removePlayer(player2.email);
  });
});
describe('when an auction floor ends', () => {
  let testArtwork: Artwork;
  let testArtworkIsNotBeingAuctioned: Artwork;
  let testArtwork2: Artwork;
  let testArtwork3: Artwork;
  let testArtwork4: Artwork;
  describe('in a non-player auction floor', () => {
    beforeEach(() => {
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
      testArtworkIsNotBeingAuctioned = {
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
      testArtwork2 = {
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
      testArtwork3 = {
        description: 'third',
        id: 3,
        primaryImage: 'third.png',
        purchasePrice: 100000000000,
        department: 'third',
        title: 'third third',
        culture: 'third',
        period: 'third',
        artist: { name: 'third third' },
        medium: 'third',
        countryOfOrigin: 'third',
        isBeingAuctioned: false,
        purchaseHistory: [],
      };
      testArtwork4 = {
        description: 'fourth',
        id: 4,
        primaryImage: 'fourth.png',
        purchasePrice: 100000000000,
        department: 'fourth',
        title: 'fourth fourth',
        culture: 'fourth',
        period: 'fourth',
        artist: { name: 'fourth fourth' },
        medium: 'fourth',
        countryOfOrigin: 'fourth',
        isBeingAuctioned: false,
        purchaseHistory: [],
      };
    });
    it('does not give artwork to anyone, and reset floor with same artwork when no bid', async () => {
      const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
      await house.addArtworksToAuctionHouse([testArtwork, testArtwork2], 0);
      await house.createNewAuctionFloorNonPlayer(1);
      const artworkBeingAuctioned = { ...AuctionHouse.artworkToBeAuctioned[0] };

      house.auctionFloors[0].timeLeft = 1;
      house.auctionFloors[0].startAuction();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise(res => setTimeout(res, 8000));

      expect(house.auctionFloors).toHaveLength(1);
      expect(house.auctionFloors[0].artBeingAuctioned).toEqual(artworkBeingAuctioned);
      expect(house.auctionFloors[0].status).toEqual('WAITING_TO_START');
      expect(house.auctionFloors[0].timeLeft).toBe(30);
      await dao.removeAuctionHouse();
      await dao.removeArtworkIDList();
    }, 100000);

    it('gives artwork properly when multiple floors are operating', async () => {
      const player = new Player(nanoid(), mock<TownEmitter>());
      player.initializeArtAuctionAccount('player@gmail.com');
      await dao.addPlayer(player.email);

      const player2 = new Player(nanoid(), mock<TownEmitter>());
      player2.initializeArtAuctionAccount('player2@gmail.com');
      await dao.addPlayer(player2.email);

      AuctionHouse.artworkToBeAuctioned = [];
      const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
      await house.addArtworksToAuctionHouse(
        [testArtwork, testArtwork2, testArtwork3, testArtwork4],
        0,
      );
      await house.createNewAuctionFloorNonPlayer(1);
      await house.createNewAuctionFloorNonPlayer(1);

      const firstFloorArtwork = { ...house.auctionFloors[0].artBeingAuctioned };
      const secondFloorArtwork = { ...house.auctionFloors[1].artBeingAuctioned };
      firstFloorArtwork.purchasePrice = 100;
      secondFloorArtwork.purchasePrice = 100;
      firstFloorArtwork.isBeingAuctioned = false;
      secondFloorArtwork.isBeingAuctioned = false;

      house.joinFloorAsBidder(player, house.auctionFloors[0].id);
      house.joinFloorAsBidder(player2, house.auctionFloors[1].id);

      house.auctionFloors[0].timeLeft = 1;
      house.auctionFloors[1].timeLeft = 1;

      house.makeBid(player, house.auctionFloors[0].id, 100);
      house.makeBid(player2, house.auctionFloors[1].id, 100);

      house.auctionFloors[0].startAuction();
      house.auctionFloors[1].startAuction();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise(res => setTimeout(res, 8000));

      expect(player.wallet.money).toBe(999900);
      expect(player2.wallet.money).toBe(999900);
      expect(player.networth).toBe(1000000);
      expect(player.networth).toBe(1000000);
      expect(player.artwork[0]).toEqual(firstFloorArtwork);
      expect(player2.artwork[0]).toEqual(secondFloorArtwork);

      const dbPlayer = await dao.getPlayer(player.email);
      const dbPlayer2 = await dao.getPlayer(player2.email);
      const artPlayerOne = dbPlayer.artworks;
      const artPlayerTwo = dbPlayer2.artworks;
      expect(artPlayerOne).toContainEqual(firstFloorArtwork);
      expect(artPlayerTwo).toContainEqual(secondFloorArtwork);
      const auctionHouseArtworks = await dao.getAllAuctionHouseArtworks();
      expect(auctionHouseArtworks).toHaveLength(2);
      expect(AuctionHouse.artworkToBeAuctioned).toHaveLength(2);
      await dao.removeAuctionHouse();
      await dao.removeArtworkIDList();
      await dao.removePlayer(player.email);
      await dao.removePlayer(player2.email);

      // check the money of the player (in db too)
      // check the networth of the player
      // check the artworks of the player (in db too)
    }, 100000);
    it('does give artwork to player when their bid is the highest at the timer end', async () => {
      const player = new Player(nanoid(), mock<TownEmitter>());
      player.initializeArtAuctionAccount('player@gmail.com');
      await dao.addPlayer(player.email);

      AuctionHouse.artworkToBeAuctioned = [];
      const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
      await house.addArtworksToAuctionHouse([testArtwork, testArtwork2], 0);
      await house.createNewAuctionFloorNonPlayer(1);

      const artworkOnAuctionFloor = { ...AuctionHouse.artworkToBeAuctioned[0] };
      artworkOnAuctionFloor.purchasePrice = 500000;
      artworkOnAuctionFloor.isBeingAuctioned = false;
      const artworkInQueue = { ...AuctionHouse.artworkToBeAuctioned[1] };
      artworkInQueue.isBeingAuctioned = true;

      house.auctionFloors[0].timeLeft = 1;
      house.auctionFloors[0].currentBid = { player, bid: 500000 };
      house.auctionFloors[0].startAuction();

      // eslint-disable-next-line no-promise-executor-return
      await new Promise(res => setTimeout(res, 10000));

      expect(player.artwork).toEqual([artworkOnAuctionFloor]);
      const playerResponse = await dao.getPlayer(player.email);
      const { artworks } = playerResponse;
      expect(artworks).toEqual([artworkOnAuctionFloor]);

      expect(house.auctionFloors).toHaveLength(1);
      expect(house.auctionFloors[0].artBeingAuctioned).toEqual(artworkInQueue);

      await dao.removePlayer(player.email);
      await dao.removeAuctionHouse();
      await dao.removeArtworkIDList();
    }, 100000);
  });

  describe('in a player owned auction floor', () => {
    beforeEach(() => {
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
      testArtworkIsNotBeingAuctioned = {
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
      testArtwork2 = {
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
    });

    it('keeps artwork in player inventory if no bid, shows that it is not being auctioned', async () => {
      const player = new Player(nanoid(), mock<TownEmitter>());
      player.initializeArtAuctionAccount('player@gmail.com');
      await dao.addPlayer(player.email);
      await player.addArtwork(testArtwork);
      await dao.addArtworksToPlayer(player.email, [testArtwork]);

      const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
      await house.createNewAuctionFloorPlayer(player, testArtwork, 1);
      house.auctionFloors[0].timeLeft = 1;

      house.auctionFloors[0].startAuction();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise(res => setTimeout(res, 10000));

      expect(player.artwork).toEqual([testArtworkIsNotBeingAuctioned]);
      const playerResponse = await dao.getPlayer(player.email);
      const { artworks } = playerResponse;
      expect(artworks).toEqual([testArtworkIsNotBeingAuctioned]);
      await dao.removePlayer(player.email);
    }, 100000);

    it('transfers artwork properly and deducts money when there is a bid', async () => {
      const player = new Player(nanoid(), mock<TownEmitter>());
      player.initializeArtAuctionAccount('player@gmail.com');
      await dao.addPlayer(player.email);
      await player.addArtwork(testArtwork);
      await dao.addArtworksToPlayer(player.email, [testArtwork]);

      const player2 = new Player(nanoid(), mock<TownEmitter>());
      player2.initializeArtAuctionAccount('player2@gmail.com');
      await dao.addPlayer(player2.email);

      const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
      await house.createNewAuctionFloorPlayer(player, testArtwork, 1);
      house.auctionFloors[0].timeLeft = 1;
      house.auctionFloors[0].currentBid = { player: player2, bid: 500000 };
      house.auctionFloors[0].startAuction();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise(res => setTimeout(res, 10000));

      expect(player.artwork).toEqual([]);
      expect(player2.artwork).toEqual([testArtworkIsNotBeingAuctioned]);
      expect(player.wallet.money).toEqual(1500000);
      expect(player2.wallet.money).toEqual(500000);
      const playerResponse = await dao.getPlayer(player.email);
      const playerResponse2 = await dao.getPlayer(player2.email);
      const { artworks } = playerResponse;
      const artworks2 = playerResponse2.artworks;
      expect(artworks).toEqual([]);
      expect(artworks2).toEqual([testArtworkIsNotBeingAuctioned]);
      expect(playerResponse.money).toEqual(1500000);
      expect(playerResponse2.money).toEqual(500000);
      await dao.removePlayer(player.email);
      await dao.removePlayer(player2.email);
    }, 100000);
    it('transfers artwork properly and deducts money when there are multiple floors running', async () => {
      const player = new Player(nanoid(), mock<TownEmitter>());
      player.initializeArtAuctionAccount('player@gmail.com');
      await dao.addPlayer(player.email);
      await player.addArtwork(testArtwork);
      await dao.addArtworksToPlayer(player.email, [testArtwork]);

      const player2 = new Player(nanoid(), mock<TownEmitter>());
      player2.initializeArtAuctionAccount('player2@gmail.com');
      await dao.addPlayer(player2.email);
      await player2.addArtwork(testArtwork2);
      await dao.addArtworksToPlayer(player2.email, [testArtwork2]);

      const player3 = new Player(nanoid(), mock<TownEmitter>());
      player3.initializeArtAuctionAccount('player3@gmail.com');
      await dao.addPlayer(player3.email);

      const player4 = new Player(nanoid(), mock<TownEmitter>());
      player4.initializeArtAuctionAccount('player4@gmail.com');
      await dao.addPlayer(player4.email);

      const house = new AuctionHouse(nanoid(), testAreaBox, mock<TownEmitter>());
      await house.createNewAuctionFloorPlayer(player, testArtwork, 1);
      await house.createNewAuctionFloorPlayer(player2, testArtwork2, 1);
      house.auctionFloors[0].timeLeft = 1;
      house.auctionFloors[1].timeLeft = 1;

      house.makeBid(player3, house.auctionFloors[0].id, 300);

      house.makeBid(player4, house.auctionFloors[1].id, 500);

      const floorOneArtwork = { ...testArtwork };
      const floorTwoArtwork = { ...testArtwork2 };
      floorOneArtwork.isBeingAuctioned = false;
      floorOneArtwork.purchasePrice = 300;
      floorTwoArtwork.isBeingAuctioned = false;
      floorTwoArtwork.purchasePrice = 500;

      house.auctionFloors[0].startAuction();
      house.auctionFloors[1].startAuction();
      // eslint-disable-next-line no-promise-executor-return
      await new Promise(res => setTimeout(res, 12000));

      // check networth, money, and artworks locally and in db

      expect(player.artwork).toHaveLength(0);
      expect(player.networth).toBe(1000300);
      expect(player.wallet.money).toBe(1000300);

      expect(player2.artwork).toHaveLength(0);
      expect(player2.networth).toBe(1000500);
      expect(player2.wallet.money).toBe(1000500);

      expect(player3.artwork[0]).toEqual(floorOneArtwork);
      expect(player3.wallet.money).toEqual(999700);
      expect(player3.networth).toEqual(1000000);

      expect(player4.artwork[0]).toEqual(floorTwoArtwork);
      expect(player4.wallet.money).toEqual(999500);
      expect(player4.networth).toEqual(1000000);

      const daoPlayer = await dao.getPlayer(player.email);
      const daoPlayer2 = await dao.getPlayer(player2.email);
      const daoPlayer3 = await dao.getPlayer(player3.email);
      const daoPlayer4 = await dao.getPlayer(player4.email);

      expect(daoPlayer.artworks).toHaveLength(0);
      expect(daoPlayer.money).toBe(1000300);

      expect(daoPlayer2.artworks).toHaveLength(0);
      expect(daoPlayer2.money).toBe(1000500);

      expect(daoPlayer3.artworks).toContainEqual(floorOneArtwork);
      expect(daoPlayer3.money).toBe(999700);

      expect(daoPlayer4.artworks).toContainEqual(floorTwoArtwork);
      expect(daoPlayer4.money).toBe(999500);

      await dao.removePlayer(player.email);
      await dao.removePlayer(player2.email);
      await dao.removePlayer(player3.email);
      await dao.removePlayer(player4.email);
    }, 100000);
  });
});
