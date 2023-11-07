import ArtworkDAO from './ArtworkDAO';

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

const testArtwork3 = {
  description: 'Its the Last Supper',
  id: 3,
  primaryImage: 'lastsupper.png',
  current_price: 2,
  department: 'unknown',
  title: 'The Last Supper',
  culture: 'unkown',
  period: '1400',
  artistDisplayName: 'Da Vinci',
  medium: 'Canvas',
  countryOfOrigin: 'Italy',
  isBeingAuctioned: false,
};
const dao = new ArtworkDAO();
let testUser: string;

describe('testing auction house not instantiated', () => {
  beforeEach(async () => {
    await dao.setAuctionHouseArtworks([]);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  afterEach(async () => {
    await dao.setAuctionHouseArtworks([]);
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('throws an error when getting artwork from auction house', async () => {
    await expect(dao.getAllArtworksAvailableToBuy()).rejects.toThrowError(
      'auction house not instantiated',
    );
  });
  it('throws an error when getting artwork from auction house', async () => {
    await expect(dao.addArtworkToAuctionHouse(testArtwork)).rejects.toThrowError(
      'auction house not instantiated',
    );
  });
});
describe('testing removeArtworkFromAuctionHouse', () => {
  beforeAll(async () => {
    await dao.setAuctionHouseArtworks([]);
    await dao.removeArtworkIDList();
  });
  afterAll(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('removes artwork from auction house properly', async () => {
    await dao.setAuctionHouseArtworks([testArtwork, testArtwork2, testArtwork3]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([
      testArtwork,
      testArtwork2,
      testArtwork3,
    ]);
    await dao.removeArtworkFromAuctionHouse(testArtwork2);
    const res = await dao.getAllArtworksAvailableToBuy();
    res.sort();
    expect(res).toEqual([testArtwork, testArtwork3].sort());
  });
});

describe('Testing adding a new player to database', () => {
  it('correctly adds a new user with no artwork', async () => {
    const u = 'nobody@gmail.com';
    await dao.addPlayer(u);
    const artworks = await dao.getAllOfPlayersArtwork(u);
    expect(artworks).toEqual([]);
    await dao.removePlayer(u);
  });
  it('throws an error if trying to add a new user with taken username', async () => {
    const tempUser1 = 'sourPatchKid@gmail.com';
    await dao.addPlayer(tempUser1);
    await expect(dao.addPlayer(tempUser1)).rejects.toThrowError(
      'user with username already exists',
    );
    await dao.removePlayer(tempUser1);
  });
});

describe('Testing logging in a player', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  it('logs in a player if they are not logged in anywhere', async () => {
    await dao.logPlayerIn(testUser);
    await expect(dao.IsPlayerLoggedIn(testUser)).resolves.toEqual(true);
    await expect(dao.getAllOfPlayersArtwork(testUser)).resolves.toEqual([]);
    await dao.logPlayerOut(testUser);
    await expect(dao.IsPlayerLoggedIn(testUser)).resolves.toEqual(false);
  });
  it('does not let a user log in if no user is in the db', async () => {
    await expect(dao.logPlayerIn('fakeplayer@gmail.com')).rejects.toThrowError(
      'user does not exist',
    );
  });
  it('does not let two users sign in as the same user', async () => {
    await dao.logPlayerIn(testUser);
    await expect(dao.logPlayerIn(testUser)).rejects.toThrowError(
      'user is already logged in somewhere else',
    );
    await dao.logPlayerOut(testUser);
    await dao.logPlayerIn(testUser);
    await expect(dao.IsPlayerLoggedIn(testUser)).resolves.toBe(true);
  });
});

describe('Testing addMoneyToPlayer', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  it('correctly adds money to the player in the db', async () => {
    await dao.setPlayerMoney(testUser, 20);
    await expect(dao.getPlayerMoney(testUser)).resolves.toEqual(20);
  });
  it('throws an error if the user does not exist', async () => {
    await expect(dao.setPlayerMoney('nonexistinguser@gmail.com', 10000)).rejects.toThrowError(
      'user does not exist',
    );
  });
});

describe('Testing addArtworkToPlayer', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('Can add a singular piece of artwork to the player', async () => {
    await dao.addArtworkToPlayer(testUser, testArtwork);
    const testUserArtworks = await dao.getPlayerArtworkById(testUser, 1);
    expect(testUserArtworks).toEqual(testArtwork);
  });
  it('Can add multiple pieces of artwork in sequence', async () => {
    await dao.addArtworkToPlayer(testUser, testArtwork);
    await dao.addArtworkToPlayer(testUser, testArtwork2);
    const userArtworks = await dao.getAllOfPlayersArtwork(testUser);
    expect(userArtworks).toEqual([testArtwork, testArtwork2]);
  });
  it('Throws an error if an artwork with duplicate ID is added to a player', async () => {
    await dao.addArtworkToPlayer(testUser, testArtwork);
    await expect(dao.addArtworkToPlayer(testUser, testArtwork)).rejects.toThrowError(
      'duplicate artwork added',
    );
  });
  it('Throws an error if the user does not exist', async () => {
    await expect(dao.addArtworkToPlayer('fakeuser@gmail.com', testArtwork)).rejects.toThrowError(
      'user does not exist',
    );
  });
});

describe('testing addArtworksToPlayer', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('successfully adds multiple artworks to a player', async () => {
    await dao.addArtworksToPlayer(testUser, [testArtwork, testArtwork2, testArtwork3]);
    const testUserArtworks = await dao.getAllOfPlayersArtwork(testUser);
    expect(testUserArtworks).toEqual([testArtwork, testArtwork2, testArtwork3]);
  });
  it('throws error if one of artworks added conflicts with ID already in user', async () => {
    await dao.addArtworkToPlayer(testUser, testArtwork2);
    await expect(
      dao.addArtworksToPlayer(testUser, [testArtwork, testArtwork2, testArtwork3]),
    ).rejects.toThrowError('duplicate artwork added');
  });
  it('throws error if one of artworks added conflicts with another being added ID', async () => {
    await expect(
      dao.addArtworksToPlayer(testUser, [testArtwork, testArtwork, testArtwork3]),
    ).rejects.toThrowError('duplicate artwork added');
  });
  it('Throws an error if the user does not exist', async () => {
    await expect(dao.addArtworksToPlayer('fakeuser@gmail.com', [testArtwork])).rejects.toThrowError(
      'user does not exist',
    );
  });
});
describe('testing setAuctionHouseArtworks', () => {
  beforeEach(async () => {
    await dao.removeArtworkIDList();
    await dao.setAuctionHouseArtworks([]);
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('properly sets auction house artworks with new artworks', async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
    await dao.setAuctionHouseArtworks([testArtwork, testArtwork2]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork, testArtwork2]);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(1);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(2);
    await dao.setAuctionHouseArtworks([testArtwork3]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork3]);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(1);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(2);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(3);
  });
  it('throws an error if an artwork id is already taken in same list', async () => {
    await expect(
      dao.setAuctionHouseArtworks([testArtwork, testArtwork, testArtwork3]),
    ).rejects.toThrowError('duplciate ID');
  });
  it('throws an error if an artwork id is already taken in at all', async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
    await dao.setAuctionHouseArtworks([testArtwork, testArtwork2]);
    await dao.setAuctionHouseArtworks([]);
    await expect(dao.setAuctionHouseArtworks([testArtwork])).rejects.toThrowError(
      'duplicate artwork in circulation',
    );
    await expect(dao.setAuctionHouseArtworks([testArtwork2])).rejects.toThrowError(
      'duplicate artwork in circulation',
    );
    await dao.setAuctionHouseArtworks([testArtwork3]);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(1);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(2);
    await expect(dao.getAllArtworkIDs()).resolves.toContain(3);
  });
});

describe('testing addArtworkToAuctionHouse', () => {
  beforeEach(async () => {
    await dao.setAuctionHouseArtworks([]);
    await dao.removeArtworkIDList();
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('adds artwork to empty auction house', async () => {
    await dao.addArtworkToAuctionHouse(testArtwork);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork]);
    await expect(dao.getAllArtworkIDs()).resolves.toEqual([1]);
  });
  it('adds artwork to non-empty auction house', async () => {
    await dao.setAuctionHouseArtworks([testArtwork2]);
    await dao.addArtworkToAuctionHouse(testArtwork);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork2, testArtwork]);
    await expect(dao.getAllArtworkIDs()).resolves.toEqual([2, 1]);
  });
  it('detects artwork with duplicate id and throws error', async () => {
    await dao.addArtworkToAuctionHouse(testArtwork);
    await expect(dao.addArtworkToAuctionHouse(testArtwork)).rejects.toThrowError(
      'duplicate artowrk in circulation',
    );
  });
});

describe('testing updateAuctionHouseArtworkByID', () => {
  beforeEach(async () => {
    await dao.setAuctionHouseArtworks([]);
    await dao.removeArtworkIDList();
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('updates a piece of artwork correctly', async () => {
    const tempArtwork = {
      description: 'aaaaa',
      id: 2,
      primaryImage: 'aaaaa',
      current_price: 100000000000,
      department: 'aaaa',
      title: 'aaaa Night',
      culture: 'aa',
      period: '1800',
      artistDisplayName: 'Van Gogh',
      medium: 'Canvas',
      countryOfOrigin: 'France',
      isBeingAuctioned: false,
    };
    await dao.setAuctionHouseArtworks([testArtwork, testArtwork2, testArtwork3]);
    await dao.updateAuctionHouseArtworkByID(tempArtwork);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toHaveLength(3);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([
      testArtwork,
      tempArtwork,
      testArtwork3,
    ]);
  });
  it('errors if the artwork with id is not there', async () => {
    const tempArtwork = {
      description: 'aaaaa',
      id: 2,
      primaryImage: 'aaaaa',
      current_price: 100000000000,
      department: 'aaaa',
      title: 'aaaa Night',
      culture: 'aa',
      period: '1800',
      artistDisplayName: 'Van Gogh',
      medium: 'Canvas',
      countryOfOrigin: 'France',
      isBeingAuctioned: false,
    };
    await dao.setAuctionHouseArtworks([testArtwork, testArtwork3]);
    await expect(dao.updateAuctionHouseArtworkByID(tempArtwork)).rejects.toThrowError();
  });
});

describe('testing getAllArtworksAvailableToBuy', () => {
  beforeEach(async () => {
    await dao.setAuctionHouseArtworks([]);
    await dao.removeArtworkIDList();
  });
  afterEach(async () => {
    await dao.removeAuctionHouse();
    await dao.removeArtworkIDList();
  });
  it('checks that all artworks in the artworks collection are returned when no artworks', async () => {
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([]);
  });
  it('checks that all artworks in the artworks collection are returned when artworks present', async () => {
    await dao.setAuctionHouseArtworks([testArtwork, testArtwork2]);
    await expect(dao.getAllArtworksAvailableToBuy()).resolves.toEqual([testArtwork, testArtwork2]);
  });
});

describe('testing getAllOfPlayersArtwork', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('returns empty when player has no artwork', async () => {
    await expect(dao.getAllOfPlayersArtwork(testUser)).resolves.toEqual([]);
  });
  it('returns artwork when player has artwork', async () => {
    await dao.addArtworksToPlayer(testUser, [testArtwork3, testArtwork2]);
    await expect(dao.getAllOfPlayersArtwork(testUser)).resolves.toEqual([
      testArtwork3,
      testArtwork2,
    ]);
  });
  it('throws an error if the user does not exist', async () => {
    await expect(dao.getAllOfPlayersArtwork('fakeuser@gmail.com')).rejects.toThrowError(
      'user does not exist',
    );
  });
});

describe('testing getPlayerArtworkById', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('throws an error if the user does not exist', async () => {
    await expect(dao.getPlayerArtworkById('fakeuser@gmail.com', 1)).rejects.toThrowError(
      'user does not exist',
    );
  });
  it('gets artwork from a user with multiple artworks', async () => {
    await dao.addArtworksToPlayer(testUser, [testArtwork, testArtwork2, testArtwork3]);
    await expect(dao.getPlayerArtworkById(testUser, 2)).resolves.toEqual(testArtwork2);
  });
  it('throws an error if the artwork does not exist', async () => {
    await expect(dao.getPlayerArtworkById(testUser, 5)).rejects.toThrowError(
      'artwork with id does not exist',
    );
  });
});

describe('testing updatePlayerArtworkById', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('throws an error if player does not exist', async () => {
    await expect(
      dao.updatePlayerArtworkById('fakeUser@gmail.com', testArtwork),
    ).rejects.toThrowError('user does not exist');
  });
  it('throws an error if arwork with id does not exist', async () => {
    await expect(dao.updatePlayerArtworkById(testUser, testArtwork)).rejects.toThrowError(
      'no artwork with id',
    );
  });

  it('correctly updates an artwork', async () => {
    const newArtwork2 = {
      description: 'new',
      id: 2,
      primaryImage: 'new',
      current_price: 0,
      department: 'new',
      title: 'Stary Night',
      culture: 'new',
      period: '1800',
      artistDisplayName: 'Van Gogh',
      medium: 'Canvas',
      countryOfOrigin: 'France',
      isBeingAuctioned: false,
    };
    await dao.addArtworksToPlayer(testUser, [testArtwork, testArtwork2, testArtwork3]);
    await dao.updatePlayerArtworkById(testUser, newArtwork2);
    await expect(dao.getPlayerArtworkById(testUser, 2)).resolves.toEqual(newArtwork2);
  });
});

describe('testing setAllOfPlayersArtwork', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('throws an error if user does not exist', async () => {
    await expect(dao.setAllOfPlayersArtwork('fakeuser@gmail.com', [])).rejects.toThrowError(
      'user does not exist',
    );
  });
  it('overwrites existing artworks', async () => {
    await dao.addArtworkToPlayer(testUser, testArtwork);
    await dao.setAllOfPlayersArtwork(testUser, [testArtwork2, testArtwork3]);
    await expect(dao.getAllOfPlayersArtwork(testUser)).resolves.toEqual([
      testArtwork2,
      testArtwork3,
    ]);
  });
});

describe('testing removeArtworkFromPlayerById', () => {
  beforeAll(async () => {
    testUser = 'testuser@gmail.com';
    await dao.addPlayer(testUser);
  });
  afterAll(async () => {
    await dao.removePlayer(testUser);
  });
  beforeEach(async () => {
    await dao.setAllOfPlayersArtwork(testUser, []);
  });
  it('throws error if user does not exist', async () => {
    await expect(dao.removeArtworkFromPlayerById('fakeuser@gmail.com', 1)).rejects.toThrowError(
      'user does not exist',
    );
  });
  it('throws error if artwork with id does not exist', async () => {
    await expect(dao.removeArtworkFromPlayerById(testUser, 1)).rejects.toThrowError(
      'no artwork with id',
    );
  });

  it('removes artwork correctly', async () => {
    await dao.addArtworksToPlayer(testUser, [testArtwork, testArtwork2, testArtwork3]);
    await dao.removeArtworkFromPlayerById(testUser, 2);
    await expect(dao.getAllOfPlayersArtwork(testUser)).resolves.toEqual([
      testArtwork,
      testArtwork3,
    ]);
  });
});

describe('test removePlayer', () => {
  it('throws error is player does not exist', async () => {
    await expect(dao.removePlayer('fakeuser@gmail.com')).rejects.toThrowError(
      'user does not exist',
    );
  });
  it('removes player when player does exist', async () => {
    const newUser = 'newUser@gmail.com';
    await dao.addPlayer(newUser);
    await expect(dao.getAllOfPlayersArtwork(newUser)).resolves.toEqual([]);
    await dao.removePlayer(newUser);
    await expect(dao.getAllOfPlayersArtwork(newUser)).rejects.toThrowError('user does not exist');
  });
});

export default {};
