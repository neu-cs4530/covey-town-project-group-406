import { Artwork } from '../types/CoveyTownSocket';

/*
  Interface for the Data access object that interacts with the database to get player and artwork info
*/
export default interface IArtworkDAO {
  /**
   * Adds artworks to the auction house collection.
   * Assumes artworks provided are unique amongst eachother
   * Creates collection if not already created
   * @param artworks: The artworks to add
   */
  addArtworksToAuctionHouse(artworks: Artwork[]): Promise<void>;
  /**
   * Adds a player to the database and defaults their values
   * @param email their email to add
   */
  addPlayer(email: string): Promise<void>;

  /**
   * Updates a players artworks in the database
   * @param email the players email
   * @param artworks the artworks to add, assumes artworks are unique amongst eachother
   */
  addArtworksToPlayer(email: string, artworks: Artwork[]): Promise<void>;

  /**
   * Returns the player's information that is stored in the database
   * @param email the player to look up
   */
  getPlayer(email: string): Promise<{ artworks: Artwork[]; money: number; isLoggedIn: boolean }>;
  /**
   * updates a players information to match the parameters provided
   * @param email player to update
   * @param isLoggedIn if they are logged in
   * @param money their money in cash
   */
  updatePlayer(email: string, isLoggedIn: boolean, money: number): Promise<void>;
  /**
   * mainly for testing purposes to clean up datatbase, removes the unique list of artworks
   */
  removeArtworkIDList(): Promise<void>;
  /**
   * returns the list of all artworks introduced (the MET ids)
   */
  getAllArtworkIDs(): Promise<number[]>;
  /**
   * Gets all of the artworks that are in the auction house ready to be sold
   */
  getAllAuctionHouseArtworks(): Promise<Artwork[]>;
  /**
   * updates an auction house artwork with the same id
   * @param artwork the artwork to update with the fields
   */
  updateAuctionHouseArtworkByID(artwork: Artwork): Promise<void>;
  /**
   * updates a players artwork
   * @param email their email
   * @param artwork the artwork to add
   */
  updatePlayerArtworkById(email: string, artwork: Artwork): Promise<void>;
  /**
   * removes an artwork from a player
   * @param email the player
   * @param artworkID the id to remove said artwork
   */
  removeArtworkFromPlayerById(email: string, artworkID: number): Promise<void>;
  /**
   * removes an artwork from an auction house
   * @param id the id of the artwork to remove
   */
  removeArtworkFromAuctionHouseById(id: number): Promise<void>;
  /**
   * removes a player from the database
   * @param email the player
   */
  removePlayer(email: string): Promise<void>;
  /**
   * removes the entire auction house collection, mainly used for testing
   */
  removeAuctionHouse(): Promise<void>;
}
