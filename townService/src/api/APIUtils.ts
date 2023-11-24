import axios, { AxiosInstance } from 'axios';
import { Artwork, ArtistInfo } from '../types/CoveyTownSocket';
import ArtworkDAO from '../db/ArtworkDAO';
import SingletonArtworkDAO from '../db/SingletonArtworkDAO';

export default class APIUtils {
  private _apiInstance: AxiosInstance;

  private _artworkIds: number[];

  private _dao: ArtworkDAO;

  constructor() {
    this._apiInstance = axios.create({
      baseURL: 'https://collectionapi.metmuseum.org/',
      timeout: 2147483647,
      headers: {},
    });
    this._artworkIds = [];
    this._dao = SingletonArtworkDAO.instance();
  }

  async nextArtworks(startIndex: number, endIndex: number): Promise<Artwork[]> {
    const artworkList: Artwork[] = [];
    while (artworkList.length === 0) {
      // eslint-disable-next-line no-await-in-loop
      await this._getArtworkIDs();

      // eslint-disable-next-line no-await-in-loop
      const rawArtworks = await Promise.all(
        this._artworkIds.slice(startIndex, endIndex).map(async objId => this.createArtwork(objId)),
      );

      for (const artwork of rawArtworks) {
        if (
          this.validArtwork(artwork) &&
          artwork !== undefined &&
          artworkList.find(a => a.id === artwork.id) === undefined
        ) {
          artworkList.push(artwork);
        }
      }
    }

    return artworkList;
  }

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
