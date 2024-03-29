import axios, { AxiosInstance } from 'axios';
import { Artwork, ArtistInfo } from '../types/CoveyTownSocket';

export default class APIUtils {
  private _apiInstance: AxiosInstance;

  private _artworkIds: number[];

  constructor() {
    this._apiInstance = axios.create({
      baseURL: 'https://collectionapi.metmuseum.org/',
      timeout: 2147483647,
      headers: {},
    });
    this._artworkIds = [];
  }

  /**
   * Returns a list of valid Artworks within the index range given from the MET API response
   * @param startIndex
   * @param endIndex
   * @returns a list of valid Artworks
   */
  async nextArtworks(startIndex: number, endIndex: number): Promise<Artwork[]> {
    const artworkList: Artwork[] = [];
    if (this._artworkIds.length === 0) {
      await this._getArtworkIDs();
    }
    const rawArtworks = await Promise.all(
      this._artworkIds.slice(startIndex, endIndex).map(async objId => this.createArtwork(objId)),
    );

    const artworkTitles: Set<string> = new Set();
    for (const artwork of rawArtworks) {
      if (
        this.validArtwork(artwork) &&
        artwork !== undefined &&
        !artworkTitles.has(artwork.title)
      ) {
        artworkList.push(artwork);
        artworkTitles.add(artwork.title);
      }
    }

    return artworkList;
  }

  // get all artwork ids that have images and an artist using MET API search endpoint
  private async _getArtworkIDs() {
    try {
      const response = await this._apiInstance.get(
        'public/collection/v1/search?hasImages=true&artistOrCulture=true&q=*',
      );
      this._artworkIds = response.data.objectIDs;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
      throw new Error('unable to get artwork IDs');
    }
  }

  /**
   * creates an Artwork object with the information of the artwork with the given id
   * @param objectId the id of the object from API
   * @returns Artwork if the id exists in the objects enpoint, else returns undefined
   */
  async createArtwork(objectId: number): Promise<Artwork | undefined> {
    let responseData = null;
    try {
      const response = await this._apiInstance.get(`public/collection/v1/objects/${objectId}`);
      responseData = response.data;
    } catch (error) {
      return undefined;
    }

    const { title } = responseData;
    const objectDate =
      responseData.objectDate !== ''
        ? responseData.objectDate
        : `${responseData.objectBeginDate} - ${responseData.objectEndDate}`;
    const artistName = responseData.artistDisplayName;
    const { medium } = responseData;
    const artistInfo: ArtistInfo = {
      name: artistName,
      biography: responseData.artistDisplayBio !== '' ? responseData.artistDisplayBio : undefined,
      nationality:
        responseData.artistNationality !== '' ? responseData.artistNationality : undefined,
      begin: responseData.artistBeginDate !== '' ? responseData.artistBeginDate : undefined,
      end: responseData.artistEndDate !== '' ? responseData.artistEndDate : undefined,
      gender: responseData.artistGender !== '' ? responseData.artistGender : undefined,
      wikiUrl: responseData.wikiUrl !== '' ? responseData.wikiUrl : undefined,
    };
    const artwork: Artwork = {
      description: `This piece of art is called '${title}' created by ${artistName} in ${objectDate} using ${medium.toLowerCase()}`,
      id: responseData.objectID,
      primaryImage: responseData.primaryImage,
      purchasePrice: 0,
      department: responseData.department,
      title,
      culture: responseData.culture !== '' ? responseData.culture : undefined,
      period: responseData.period !== '' ? responseData.period : undefined,
      artist: artistInfo,
      medium,
      countryOfOrigin: responseData.country !== '' ? responseData.country : undefined,
      isBeingAuctioned: false,
      purchaseHistory: [],
    };
    return artwork;
  }

  /**
   * determines if a given artwork is valid
   * @param artwork an artowrk or undefined
   * @returns returns true it is a valid artwork, false otherwise
   */
  validArtwork(artwork: Artwork | undefined): boolean {
    if (artwork === undefined) {
      return false;
    }
    return (
      artwork.primaryImage !== '' &&
      artwork.department !== '' &&
      artwork.title !== '' &&
      artwork.medium !== '' &&
      artwork.artist.name !== '' &&
      artwork.description !== ''
    );
  }
}
