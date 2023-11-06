import { Artwork } from '../types/Artwork';

export default interface IArtworkDAO {
  /**
   * Adds a player to the database with no artworks
   * This method must be called before adding artwork to a player
   * @param email: Player's email
   */
  addPlayer(email: string): Promise<void>;

  /**
   * Gets an array of all of the artworks that have ever been in circulation in covey.town
   */
  getAllArtworkIDs(): Promise<number[]>;
  /**
   * logs a player in, ensuring only one player can be logged into an account at any given time
   * @param email: Player to log in
   */
  logPlayerIn(email: string): Promise<void>;

  /**
   * logs a player out
   * @param email: Player to log in
   */
  logPlayerOut(email: string): Promise<void>;

  /**
   * checks if there is a player logged in as this user currently
   */
  IsPlayerLoggedIn(email: string): Promise<boolean>;
  /**
   * Adds an artwork to a player in the database
   * @param email: Player's email
   * @param artwork: Artwork to add
   */
  addArtworkToPlayer(email: string, artwork: Artwork): Promise<void>;

  /**
   * sets a given players money in the database
   * @param email: the player to update
   * @param money: the value to set for their money
   */
  setPlayerMoney(email: string, money: number): Promise<void>;

  /**
   * Gets the money for a given player in the database
   * @param email: the money to get
   */
  getPlayerMoney(email: string): Promise<void>;
  /**
   * Adds multiple artworks to a player in the database
   * @param email: Player's email
   * @param artworks: Artworks to add
   */
  addArtworksToPlayer(email: string, artworks: Artwork[]): Promise<void>;

  /**
   * Sets the available artworks in the auction house
   * This method is used to initialize and reset auction house
   * artworks
   * @param artworks: the artworks to set the database field to
   */
  setAuctionHouseArtworks(artworks: Artwork[]): Promise<void>;

  /**
   * Adds a singular artwork to the auction house
   * @param artwork: The artwork to add
   */
  addArtworkToAuctionHouse(artwork: Artwork): Promise<void>;

  /**
   * Gets all of the artworks from the auction house
   * that are in the database
   */
  getAllArtworksAvailableToBuy(): Promise<Artwork[]>;

  /**
   *  gets all of a players artwork from the database
   * @param email: Player's email
   */
  getAllOfPlayersArtwork(email: string): Promise<Artwork[]>;

  /**
   * Gets a specific piece of artwork from a player
   * @param email: Player's email
   * @param artworkID: The ID of artwork to retrieve
   */
  getPlayerArtworkById(email: string, artworkID: number): Promise<Artwork>;

  /**
   * updates a piece of artwork in a player's collection
   * the artwork id's must match, and all other fields
   * will be overwriten
   * @param email: Player's email
   * @param artwork: artwork to update (ID must match, other fields are fields to be updated)
   */
  updatePlayerArtworkById(email: string, artwork: Artwork): Promise<void>;

  /**
   * Sets all of a players artwork, overwriting what is there
   * @param email: Player's email
   * @param newArtwork: The new artwork to set
   */
  setAllOfPlayersArtwork(email: string, newArtwork: Artwork[]): Promise<void>;

  /**
   *  Removes a specific artwork from a users collection
   * @param email: Player's email
   * @param artworkID: the ID of art to remove
   */
  removeArtworkFromPlayerById(email: string, artworkID: number): Promise<void>;
  /**
   * Removes artwork from the auction house collection
   * @param artwork: Artwork to remove (with matching ID)
   */
  removeArtworkFromAuctionHouse(artwork: Artwork): Promise<void>;

  /**
   * removes a player from the database
   * @param email: Player's email
   */
  removePlayer(email: string): Promise<void>;

  /**
   * removes the auction house collection
   */
  removeAuctionHouse(): Promise<void>;
}
