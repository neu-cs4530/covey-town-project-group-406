import { FieldValue } from 'firebase-admin/firestore';
import { Artwork } from '../types/CoveyTownSocket';
import IArtworkDAO from './IArtworkDAO';
import SingletonDBConnection from './SingletonDBConnection';

export default class ArtworkDAO implements IArtworkDAO {
  artworkIDsCollection = 'artworkIDs';

  userCollection = 'users';

  auctionHouseCollection = 'AuctionHouse';

  private _db: FirebaseFirestore.Firestore;

  public constructor() {
    this._db = SingletonDBConnection.instance();
  }

  /**
   * Gets a specific artwork from a user
   * @param email the user
   * @param artworkID the id of the artwork to fetch
   * @returns the artwork requested
   */
  private async _getPlayerArtworkById(email: string, artworkID: number): Promise<Artwork> {
    try {
      const response = await this._getUserFromDatabase(email);
      if (!response.exists) {
        throw new Error('user does not exist');
      }

      const artwork: Artwork = response.data()?.artworks.find((a: Artwork) => a.id === artworkID);

      if (artwork === undefined || artwork === null) {
        throw new Error('no artwork with id');
      }

      return artwork;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Error getting artwork from player with ID');
    }
  }

  /**
   * gets a list of the players artwork
   * @param email: the email of the player
   * @returns an array of artworks
   */
  private async _getAllOfPlayersArtwork(email: string): Promise<Artwork[]> {
    try {
      const response = await this._getUserFromDatabase(email);
      if (!response.exists) {
        throw new Error('user does not exist');
      }
      return response.data()?.artworks;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Error getting players artwork');
    }
  }

  /**
   * Adds a piece of artwork to a player
   * @param email the player's email
   * @param artwork the artwork to add
   */
  private async _addArtworkToPlayer(email: string, artwork: Artwork): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }

      // Ensure that the player does not have the artwork being added to their account
      const artworksOfPlayer = await this._getAllOfPlayersArtwork(email);
      if (!this._areArtworksUnique(artworksOfPlayer, [artwork])) {
        throw new Error('duplicate artwork added');
      }

      await this._db
        .collection(this.userCollection)
        .doc(email)
        .set({ artworks: FieldValue.arrayUnion(artwork) }, { merge: true });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Adds an artwork to the auction house collection in the database
   * @param artwork
   */
  private async _addArtworkToAuctionHouse(artwork: Artwork): Promise<void> {
    try {
      let allArtworkIDsCollection = await this._db
        .collection(this.artworkIDsCollection)
        .doc('artworks')
        .get();

      if (!allArtworkIDsCollection.exists) {
        await this._db
          .collection(this.artworkIDsCollection)
          .doc('artworks')
          .set({ artworkIDs: [] });
      }

      allArtworkIDsCollection = await this._db
        .collection(this.artworkIDsCollection)
        .doc('artworks')
        .get();

      let auctionHouseCollection = await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .get();

      if (!auctionHouseCollection) {
        await this._db
          .collection(this.auctionHouseCollection)
          .doc('artworks')
          .set({ artworks: [] });
      }

      auctionHouseCollection = await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .get();

      const allArtworks: number[] = allArtworkIDsCollection.data()?.artworkIDs;
      if (this._areAnyOfArtworksAreInCirculation(allArtworks, [artwork])) {
        throw new Error('duplicate artowrk in circulation');
      }

      await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .set({ artworks: FieldValue.arrayUnion(artwork) }, { merge: true });
      await this._addArtworkIDToLog(artwork.id);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Private method to help get a user from the database with a given email
   * @param email : users email
   * @returns the userRef from the database
   */
  private async _getUserFromDatabase(email: string) {
    const userRef = await this._db.collection(this.userCollection).doc(email).get();
    return userRef;
  }

  /**
   * Adds an artwork to the registry for all artworks seen
   * @param id the artwork id
   */
  private async _addArtworkIDToLog(id: number): Promise<void> {
    await this._db
      .collection(this.artworkIDsCollection)
      .doc('artworks')
      .update({
        artworkIDs: FieldValue.arrayUnion(id),
      });
  }

  private _areAnyOfArtworksAreInCirculation(allArtworkIDs: number[], artworks: Artwork[]): boolean {
    for (const art of artworks) {
      if (allArtworkIDs.find(id => id === art.id)) {
        return true;
      }
    }
    return false;
  }

  private _areArtworksUnique(storedArts: Artwork[], newArts: Artwork[]) {
    for (const art of newArts) {
      const duplicatedArt = storedArts.find(artwork => artwork.id === art.id);
      if (duplicatedArt) {
        return false;
      }
    }
    const newArtsSet = new Set<number>();
    for (const art of newArts) {
      if (newArtsSet.has(art.id)) {
        return false;
      }
      newArtsSet.add(art.id);
    }
    return true;
  }

  /**
   * Adds multiple artworks to the auction house
   * */
  public async addArtworksToAuctionHouse(artworks: Artwork[]) {
    await Promise.all(artworks.map(async artwork => this._addArtworkToAuctionHouse(artwork)));
  }

  /**
   * Adds a player to the database
   * @param email the player's email to add
   */
  public async addPlayer(email: string): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (userRef.exists) {
        throw new Error('user with username already exists');
      }
      await this._db.collection(this.userCollection).doc(email).set({
        artworks: [],
        money: 1000000,
        isLoggedIn: false,
      });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Adds multiple artworks to a player in one go
   * @param email
   * @param artworks
   */
  public async addArtworksToPlayer(email: string, artworks: Artwork[]): Promise<void> {
    await Promise.all(artworks.map(async artwork => this._addArtworkToPlayer(email, artwork)));
  }

  /**
   * gets a player from the database
   */
  public async getPlayer(
    email: string,
  ): Promise<{ artworks: Artwork[]; money: number; isLoggedIn: boolean }> {
    const playerResponse = await this._db.collection(this.userCollection).doc(email).get();
    const data = playerResponse.data();
    if (data) {
      return { artworks: data.artworks, money: data.money, isLoggedIn: data.isLoggedIn };
    }
    throw new Error('cannot find user data');
  }

  public async logOutAllPlayers(): Promise<void> {
    const playersResponse = await this._db.collection(this.userCollection).get();
    const { docs } = playersResponse;

    await Promise.all(
      docs.map(async doc => {
        await this._db.collection(this.userCollection).doc(doc.id).update({
          isLoggedIn: false,
        });
      }),
    );
  }

  /**
   * updates a player with the corresponding fields
   */
  public async updatePlayer(email: string, isLoggedIn: boolean, money: number) {
    try {
      await this._db.collection(this.userCollection).doc(email).update({ isLoggedIn, money });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Removes collection that keeps track of all artwork IDs in the database
   */
  public async removeArtworkIDList(): Promise<void> {
    await this._db.collection(this.artworkIDsCollection).doc('artworks').delete();
  }

  /**
   * Really a method for testing, used to ensure that artwork IDs are added properly
   * @returns a list of the ids in the colletion
   */
  public async getAllArtworkIDs(): Promise<number[]> {
    const ref = await this._db.collection(this.artworkIDsCollection).doc('artworks').get();
    if (!ref.exists) {
      throw new Error('artwork ids collection not instantiated properly');
    }
    return ref.data()?.artworkIDs;
  }

  /**
   * Retreives all of the artworks that are in the database for the auction house
   * @returns a list of artworks
   */
  public async getAllAuctionHouseArtworks(): Promise<Artwork[]> {
    try {
      const response = await this._db.collection(this.auctionHouseCollection).doc('artworks').get();
      if (!response.exists) {
        throw new Error('auction house not instantiated properly');
      }
      return response.data()?.artworks;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Error getting auction house Artworks');
    }
  }

  /**
   * updates a singular artwork in the auction house by ID
   * @param artwork
   */
  public async updateAuctionHouseArtworkByID(artwork: Artwork) {
    try {
      const allArtworks: Artwork[] = await this.getAllAuctionHouseArtworks();
      const artworkToRemove = allArtworks.find((a: Artwork) => a.id === artwork.id);
      if (!artworkToRemove) {
        throw new Error('no artwork with id');
      }
      await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .update({
          artworks: FieldValue.arrayRemove(artworkToRemove),
        });

      await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .update({
          artworks: FieldValue.arrayUnion(artwork),
        });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * updates a specific players artwork by id
   * @param email the players email
   * @param artwork the players artwork
   */
  public async updatePlayerArtworkById(email: string, artwork: Artwork): Promise<void> {
    try {
      const artworkToRemove = await this._getPlayerArtworkById(email, artwork.id);
      await this._db
        .collection(this.userCollection)
        .doc(email)
        .update({
          artworks: FieldValue.arrayRemove(artworkToRemove),
        });

      await this._db
        .collection(this.userCollection)
        .doc(email)
        .update({
          artworks: FieldValue.arrayUnion(artwork),
        });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * removes a specific artwork from a player by id
   * @param email: the email of the player
   * @param artworkID the id to remove from the player
   */
  public async removeArtworkFromPlayerById(email: string, artworkID: number): Promise<void> {
    try {
      const allArtwork = await this._getAllOfPlayersArtwork(email);
      const artworkToRemove = allArtwork.find((a: Artwork) => a.id === artworkID);
      if (!artworkToRemove) {
        throw new Error('no artwork with id');
      }
      await this._db
        .collection(this.userCollection)
        .doc(email)
        .update({
          artworks: FieldValue.arrayRemove(artworkToRemove),
        });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * removes an artwork from the auction house
   * @param artwork the artwork to remove
   */
  public async removeArtworkFromAuctionHouseById(id: number): Promise<void> {
    try {
      const response = await this._db.collection(this.auctionHouseCollection).doc('artworks').get();
      if (!response.exists) {
        throw new Error('auction house not insantiated properly');
      }

      const allArtworks: Artwork[] = response.data()?.artworks;
      const artworkToRemove = allArtworks.find((a: Artwork) => a.id === id);
      if (!artworkToRemove) {
        throw new Error('no artwork with id');
      }
      await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .update({
          artworks: FieldValue.arrayRemove(artworkToRemove),
        });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * removes a player from the database
   * @param email the email of the player
   */
  public async removePlayer(email: string): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      await this._db.collection(this.userCollection).doc(email).delete();
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * removes the auction house from the database
   */
  public async removeAuctionHouse(): Promise<void> {
    try {
      const paintingsRef = await this._db
        .collection(this.auctionHouseCollection)
        .doc('artworks')
        .get();
      if (!paintingsRef.exists) {
        throw new Error('artworks do not exist');
      }
      await this._db.collection(this.auctionHouseCollection).doc('artworks').delete();
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }
}
