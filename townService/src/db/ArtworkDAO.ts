import { FieldValue } from 'firebase-admin/firestore';
import { Artwork } from '../types/Artwork';
import db from './DBConfig';
import IArtworkDAO from './IArtworkDAO';

export default class ArtworkDAO implements IArtworkDAO {
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
      await db.collection('users').doc(email).set({ artworks: [] });
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

  public async setAuctionHouseArtworks(artworks: Artwork[]): Promise<void> {
    try {
      const newIDs = new Set<number>();
      for (const a of artworks) {
        if (newIDs.has(a.id)) {
          throw new Error('duplciate ID');
        }
        newIDs.add(a.id);
      }
      await db.collection('AuctionHouse').doc('artworks').set({ artworks });
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  public async addArtworkToAuctionHouse(artwork: Artwork): Promise<void> {
    try {
      const newIDs = new Set<number>();
      const artworksInAuctionHouse = await this.getAllArtworksAvailableToBuy();
      for (const a of artworksInAuctionHouse) {
        newIDs.add(a.id);
        if (newIDs.has(artwork.id)) {
          throw new Error('duplicate ID');
        }
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
      await this.setAuctionHouseArtworks(result);
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
