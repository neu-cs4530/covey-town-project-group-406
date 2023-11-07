import { Artwork } from '../types/CoveyTownSocket';

/*
  Interface for the Data access object that interacts with the database to get player and artwork info
*/
export default interface IArtworkDAO {
  addArtworksToAuctionHouse(artworks: Artwork[]): Promise<void>;
  addPlayer(email: string): Promise<void>;
  addArtworksToPlayer(email: string, artworks: Artwork[]): Promise<void>;
  getPlayer(email: string): Promise<{ artworks: Artwork[]; money: number; isLoggedIn: boolean }>;
  updatePlayer(email: string, isLoggedIn: boolean, money: number): Promise<void>;
  removeArtworkIDList(): Promise<void>;
  getAllArtworkIDs(): Promise<number[]>;
  getAllAuctionHouseArtworks(): Promise<Artwork[]>;
  updateAuctionHouseArtworkByID(artwork: Artwork): Promise<void>;
  updatePlayerArtworkById(email: string, artwork: Artwork): Promise<void>;
  removeArtworkFromPlayerById(email: string, artworkID: number): Promise<void>;
  removeArtworkFromAuctionHouseById(id: number): Promise<void>;
  removePlayer(email: string): Promise<void>;
  removeAuctionHouse(): Promise<void>;
}
