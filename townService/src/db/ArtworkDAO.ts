import { FieldValue } from 'firebase-admin/firestore';
import { Artwork } from '../types/Artwork';
import db from './DBConfig';
import IArtworkDAO from './IArtworkDAO';

export default class ArtworkDAO implements IArtworkDAO {
  public async removeArtworkIDList(): Promise<void> {
    await db.collection('artworkIDs').doc('artworks').delete();
  }

  public async IsPlayerLoggedIn(email: string): Promise<boolean> {
    try {
      const userRef = await db.collection('users').doc(email).get();
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

  public async logPlayerOut(email: string): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      await db.collection('users').doc(email).set(
        {
          isLoggedIn: false,
        },
        {
          merge: true,
        },
      );
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async logPlayerIn(email: string): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      if (userRef.data()?.isLoggedIn === true) {
        throw new Error('user is already logged in somewhere else');
      }
      await db.collection('users').doc(email).set(
        {
          isLoggedIn: true,
        },
        {
          merge: true,
        },
      );
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async setPlayerMoney(email: string, money: number): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      await db.collection('users').doc(email).set(
        {
          money,
        },
        {
          merge: true,
        },
      );
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async getPlayerMoney(email: string): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
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

  public async addArtworkToPlayer(email: string, artwork: Artwork): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      const artworksOfPlayer = await this.getAllOfPlayersArtwork(email);
      if (artworksOfPlayer !== undefined) {
        for (const a of artworksOfPlayer) {
          if (a.id === artwork.id) {
            throw new Error('duplicate artwork added');
          }
        }
      }
      await db
        .collection('users')
        .doc(email)
        .update({ artworks: FieldValue.arrayUnion(artwork) });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async addPlayer(email: string): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (userRef.exists) {
        throw new Error('user with username already exists');
      }
      await db.collection('users').doc(email).set({
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

  public async addArtworksToPlayer(email: string, artworks: Artwork[]): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      const artworksOfPlayer = await this.getAllOfPlayersArtwork(email);
      const newIDs = new Set<number>();
      if (artworksOfPlayer !== undefined) {
        for (const newArtwork of artworks) {
          if (newIDs.has(newArtwork.id)) {
            throw new Error('duplicate artwork added');
          }
          for (const a of artworksOfPlayer) {
            if (a.id === newArtwork.id) {
              throw new Error('duplicate artwork added');
            }
          }
          newIDs.add(newArtwork.id);
        }
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

  private async _addArtworkIDToLog(id: number): Promise<void> {
    await db
      .collection('artworkIDs')
      .doc('artworks')
      .set(
        {
          artworkIDs: FieldValue.arrayUnion(id),
        },
        { merge: true },
      );
  }

  public async getAllArtworkIDs(): Promise<number[]> {
    const ref = await db.collection('artworkIDs').doc('artworks').get();
    if (!ref.exists) {
      throw new Error('artwork ids collection not instantiated properly');
    }
    return ref.data()?.artworkIDs;
  }

  public async setAuctionHouseArtworks(artworks: Artwork[]): Promise<void> {
    try {
      let collectionResponse = await db.collection('artworkIDs').doc('artworks').get();
      if (!collectionResponse.exists) {
        await db.collection('artworkIDs').doc('artworks').set({ artworkIDs: [] });
      }
      collectionResponse = await db.collection('artworkIDs').doc('artworks').get();
      const allArtworkIDs: number[] = collectionResponse.data()?.artworkIDs;
      const ids: Set<number> = new Set();
      for (const a of artworks) {
        if (allArtworkIDs.indexOf(a.id) !== -1) {
          throw new Error('duplicate artwork in circulation');
        }
        if (ids.has(a.id)) {
          throw new Error('duplciate ID');
        }
        ids.add(a.id);
      }
      await db.collection('AuctionHouse').doc('artworks').set({ artworks });
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

  public async addArtworkToAuctionHouse(artwork: Artwork): Promise<void> {
    try {
      const response = await db.collection('AuctionHouse').doc('artworks').get();
      if (!response.exists) {
        throw new Error('auction house not instantiated properly');
      }
      let collectionResponse = await db.collection('artworkIDs').doc('artworks').get();
      if (!collectionResponse.exists) {
        await db.collection('artworkIDs').doc('artworks').set({ artworkIDs: [] });
      }
      collectionResponse = await db.collection('artworkIDs').doc('artworks').get();
      const allArtworks: number[] = collectionResponse.data()?.artworkIDs;
      if (allArtworks.indexOf(artwork.id) !== -1) {
        throw new Error('duplicate artowrk in circulation');
      }
      await db
        .collection('AuctionHouse')
        .doc('artworks')
        .set(
          { artworks: FieldValue.arrayUnion(artwork) },
          {
            merge: true,
          },
        );
      await this._addArtworkIDToLog(artwork.id);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async getAllArtworksAvailableToBuy(): Promise<Artwork[]> {
    try {
      const response = await db.collection('AuctionHouse').doc('artworks').get();
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

  public async getAllOfPlayersArtwork(email: string): Promise<Artwork[]> {
    try {
      const response = await db.collection('users').doc(email).get();
      if (!response.exists) {
        throw new Error('user does not exist');
      }
      const a = response.data()?.artworks;
      if (a === undefined) {
        return [];
      }
      return a;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('Error getting players artwork');
    }
  }

  public async getPlayerArtworkById(email: string, artworkID: number): Promise<Artwork> {
    try {
      const response = await db.collection('users').doc(email).get();
      if (!response.exists) {
        throw new Error('user does not exist');
      }
      const artwork: Artwork = response
        .data()
        ?.artworks.filter((a: Artwork) => a.id === artworkID)[0];
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

  public async updatePlayerArtworkById(email: string, artwork: Artwork): Promise<void> {
    try {
      const allArtworks = await this.getAllOfPlayersArtwork(email);
      let count = 0;
      allArtworks.map((a: Artwork) => {
        if (a.id === artwork.id) {
          count += 1;
          Object.assign(a, artwork);
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

  public async setAllOfPlayersArtwork(email: string, newArtwork: Artwork[]): Promise<void> {
    try {
      const response = await db.collection('users').doc(email).get();
      if (!response.exists) {
        throw new Error('user does not exist');
      }
      await db.collection('users').doc(email).set({
        artworks: newArtwork,
      });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

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

  public async removeArtworkFromAuctionHouse(artwork: Artwork): Promise<void> {
    try {
      const response = await db.collection('AuctionHouse').doc('artworks').get();
      if (!response.exists) {
        throw new Error('auction house not insantiated properly');
      }
      const allArtworks: Artwork[] = response.data()?.artworks;
      const result = allArtworks.filter((a: Artwork) => a.id !== artwork.id);
      if (allArtworks.length === result.length) {
        throw new Error('no artwork with id');
      }
      await db.collection('AuctionHouse').doc('artworks').set({ artworks: result });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async removePlayer(email: string): Promise<void> {
    try {
      const userRef = await db.collection('users').doc(email).get();
      if (!userRef.exists) {
        throw new Error('user does not exist');
      }
      await db.collection('users').doc(email).delete();
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async removeAuctionHouse(): Promise<void> {
    try {
      const paintingsRef = await db.collection('AuctionHouse').doc('artworks').get();
      if (!paintingsRef.exists) {
        throw new Error('artworks do not exist');
      }
      await db.collection('AuctionHouse').doc('artworks').delete();
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }
}
