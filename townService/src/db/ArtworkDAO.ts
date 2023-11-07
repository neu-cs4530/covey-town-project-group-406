import { FieldValue } from 'firebase-admin/firestore';
import { Artwork } from '../types/CoveyTownSocket';
import db from './DBConfig';
import IArtworkDAO from './IArtworkDAO';

export default class ArtworkDAO implements IArtworkDAO {
  ARTWORK_IDS_COLLECTION = 'artworkIDs';

  USER_COLLECTION = 'users';

  AUCTION_HOUSE_COLLECTION = 'AuctionHouse';

  /**
   * Private method to help get a user from the database with a given email
   * @param email : users email
   * @returns the userRef from the database
   */
  private async _getUserFromDatabase(email: string) {
    const userRef = await db.collection(this.USER_COLLECTION).doc(email).get();
    return userRef;
  }

  /**
   * Removes collection that keeps track of all artwork IDs in the database
   */
  public async removeArtworkIDList(): Promise<void> {
    await db.collection(this.ARTWORK_IDS_COLLECTION).doc('artworks').delete();
  }

  /**
   * Checks if the player is logged in in the database
   * @param email: the player's email
   * @returns true if they are logged in, false otherwise
   */
  public async IsPlayerLoggedIn(email: string): Promise<boolean> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      return userRef.data()?.isLoggedIn;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('could not log user in');
    }
  }

  /**
   * Logs player out of their account
   * @param email : email to log out
   */
  public async logPlayerOut(email: string): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      await db
        .collection(this.USER_COLLECTION)
        .doc(email)
        .set({ isLoggedIn: false }, { merge: true });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Logs a player in to their artAuctionAccount
   * @param email : player to log in
   */
  public async logPlayerIn(email: string): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      if (userRef.data()?.isLoggedIn === true) {
        throw new Error('user is already logged in somewhere else');
      }
      await db
        .collection(this.USER_COLLECTION)
        .doc(email)
        .set({ isLoggedIn: true }, { merge: true });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Sets a player's money in the database
   * @param email : the player to set
   * @param money : the money to set
   */
  public async setPlayerMoney(email: string, money: number): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      await db.collection(this.USER_COLLECTION).doc(email).set({ money }, { merge: true });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * retreives a player's money from the database
   * @param email : player to reteive
   * @returns : their money
   */
  public async getPlayerMoney(email: string): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      return userRef.data()?.money;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('error getting user money');
    }
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
   * Adds a piece of artwork to a player
   * @param email the player's email
   * @param artwork the artwork to add
   */
  public async addArtworkToPlayer(email: string, artwork: Artwork): Promise<void> {
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }

      // Ensure that the player does not have the artwork being added to their account
      const artworksOfPlayer = await this.getAllOfPlayersArtwork(email);
      if (!this._areArtworksUnique(artworksOfPlayer, [artwork])) {
        throw new Error('duplicate artwork added');
      }

      await db
        .collection(this.USER_COLLECTION)
        .doc(email)
        .update({ artworks: FieldValue.arrayUnion(artwork) });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
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
      await db.collection(this.USER_COLLECTION).doc(email).set({
        artworks: [],
        money: 0,
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
    try {
      const userRef = await this._getUserFromDatabase(email);
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }

      const artworksOfPlayer = await this.getAllOfPlayersArtwork(email);
      if (!this._areArtworksUnique(artworksOfPlayer, artworks)) {
        throw new Error('duplicate artwork added');
      }

      await db
        .collection('users')
        .doc(email)
        .update({ artworks: FieldValue.arrayUnion(...artworks) });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * Adds an artwork to the registry for all artworks seen
   * @param id the artwork id
   */
  private async _addArtworkIDToLog(id: number): Promise<void> {
    await db
      .collection(this.ARTWORK_IDS_COLLECTION)
      .doc('artworks')
      .update({
        artworkIDs: FieldValue.arrayUnion(id),
      });
  }

  /**
   * Really a method for testing, used to ensure that artwork IDs are added properly
   * @returns a list of the ids in the colletion
   */
  public async getAllArtworkIDs(): Promise<number[]> {
    const ref = await db.collection(this.ARTWORK_IDS_COLLECTION).doc('artworks').get();
    if (!ref.exists) {
      throw new Error('artwork ids collection not instantiated properly');
    }
    return ref.data()?.artworkIDs;
  }

  public async setAuctionHouseArtworks(artworks: Artwork[]): Promise<void> {
    try {
      let collectionResponse = await db
        .collection(this.ARTWORK_IDS_COLLECTION)
        .doc('artworks')
        .get();
      if (!collectionResponse.exists) {
        await db.collection(this.ARTWORK_IDS_COLLECTION).doc('artworks').set({ artworkIDs: [] });
      }
      collectionResponse = await db.collection(this.ARTWORK_IDS_COLLECTION).doc('artworks').get();

      const allArtworkIDs: number[] = collectionResponse.data()?.artworkIDs;

      if (this._areAnyOfArtworksAreInCirculation(allArtworkIDs, artworks)) {
        throw new Error('duplicate artwork in circulation');
      }
      if (!this._areArtworksUnique([], artworks)) {
        throw new Error('duplciate ID');
      }

      await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').set({ artworks });
      await Promise.all(
        artworks.map(async artwork => {
          await this._addArtworkIDToLog(artwork.id);
        }),
      );
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  private _areAnyOfArtworksAreInCirculation(allArtworkIDs: number[], artworks: Artwork[]): boolean {
    for (const art of artworks) {
      if (allArtworkIDs.find(id => id === art.id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds an artwork to the auction house
   * @param artwork
   */
  public async addArtworkToAuctionHouse(artwork: Artwork): Promise<void> {
    try {
      const response = await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').get();
      if (!response.exists) {
        throw new Error('auction house not instantiated properly');
      }

      let collectionResponse = await db
        .collection(this.ARTWORK_IDS_COLLECTION)
        .doc('artworks')
        .get();
      if (!collectionResponse.exists) {
        await db.collection(this.ARTWORK_IDS_COLLECTION).doc('artworks').set({ artworkIDs: [] });
      }

      collectionResponse = await db.collection(this.ARTWORK_IDS_COLLECTION).doc('artworks').get();
      const allArtworks: number[] = collectionResponse.data()?.artworkIDs;
      if (this._areAnyOfArtworksAreInCirculation(allArtworks, [artwork])) {
        throw new Error('duplicate artowrk in circulation');
      }

      await db
        .collection(this.AUCTION_HOUSE_COLLECTION)
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
   * Retreives all of the artworks that are in the database for the auction house
   * @returns a list of artworks
   */
  public async getAllArtworksAvailableToBuy(): Promise<Artwork[]> {
    try {
      const response = await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').get();
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
   * gets a list of the players artwork
   * @param email: the email of the player
   * @returns an array of artworks
   */
  public async getAllOfPlayersArtwork(email: string): Promise<Artwork[]> {
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
   * Gets a specific artwork from a user
   * @param email the user
   * @param artworkID the id of the artwork to fetch
   * @returns the artwork requested
   */
  public async getPlayerArtworkById(email: string, artworkID: number): Promise<Artwork> {
    try {
      const response = await this._getUserFromDatabase(email);
      if (!response.exists) {
        throw new Error('user does not exist');
      }

      const artwork: Artwork = response.data()?.artworks.find((a: Artwork) => a.id === artworkID);

      if (artwork === undefined || artwork === null) {
        throw new Error('artwork with id does not exist');
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
   * updates a singular artwork in the auction house by ID
   * @param artwork
   */
  public async updateAuctionHouseArtworkByID(artwork: Artwork) {
    try {
      let allArtworks: Artwork[] = await this.getAllArtworksAvailableToBuy();

      let count = 0;
      allArtworks = allArtworks.map((a: Artwork) => {
        if (a.id === artwork.id) {
          count += 1;
          return artwork;
        }
        return a;
      });

      if (count === 0) {
        throw new Error('no artwork with id');
      }

      await db
        .collection(this.AUCTION_HOUSE_COLLECTION)
        .doc('artworks')
        .set({ artworks: allArtworks });
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
      let allArtworks = await this.getAllOfPlayersArtwork(email);
      let count = 0;
      allArtworks = allArtworks.map((a: Artwork) => {
        if (a.id === artwork.id) {
          count += 1;
          return artwork;
        }
        return a;
      });
      if (count === 0) {
        throw new Error('no artwork with id');
      }
      await this.setAllOfPlayersArtwork(email, allArtworks);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  /**
   * settings all of a players artwork
   * @param email the players artwork to set
   * @param newArtwork the new artwork to set
   */
  public async setAllOfPlayersArtwork(email: string, newArtwork: Artwork[]): Promise<void> {
    try {
      const response = await this._getUserFromDatabase(email);
      if (!response.exists) {
        throw new Error('user does not exist');
      }
      await db.collection(this.USER_COLLECTION).doc(email).set({
        artworks: newArtwork,
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
      const allArtwork = await this.getAllOfPlayersArtwork(email);
      const newArtwork = allArtwork.filter((a: Artwork) => a.id !== artworkID);
      if (allArtwork.length === newArtwork.length) {
        throw new Error('no artwork with id');
      }
      await this.setAllOfPlayersArtwork(email, newArtwork);
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
  public async removeArtworkFromAuctionHouse(artwork: Artwork): Promise<void> {
    try {
      const response = await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').get();
      if (!response.exists) {
        throw new Error('auction house not insantiated properly');
      }

      const allArtworks: Artwork[] = response.data()?.artworks;
      const result = allArtworks.filter((a: Artwork) => a.id !== artwork.id);
      if (allArtworks.length === result.length) {
        throw new Error('no artwork with id');
      }

      await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').set({ artworks: result });
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
      await db.collection(this.USER_COLLECTION).doc(email).delete();
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
      const paintingsRef = await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').get();
      if (!paintingsRef.exists) {
        throw new Error('artworks do not exist');
      }
      await db.collection(this.AUCTION_HOUSE_COLLECTION).doc('artworks').delete();
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }
}
