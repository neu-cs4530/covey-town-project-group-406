import axios, { AxiosInstance } from 'axios';
import { Artwork, ArtistInfo } from '../types/CoveyTownSocket';

export default class APIUtils {
  private _apiInstance: AxiosInstance;

  private _artworkIds: number[];

  constructor() {
    this._apiInstance = axios.create({
      baseURL: 'https://collectionapi.metmuseum.org/',
      timeout: 5000,
      headers: {},
    });
    this._artworkIds = [];
  }

  async nextArtworks(startIndex: number, endIndex: number): Promise<Artwork[]> {
    const artworkList: Artwork[] = [];
    if (this._artworkIds.length === 0) {
      this._getArtworkIDs();
    }
    await Promise.all(
      this._artworkIds.slice(startIndex, endIndex).map(async objId => {
        const artwork = await this.createArtwork(objId);
        if (this.validArtwork(artwork)) {
          artworkList.push(artwork);
        }
      }),
    );
    return artworkList;
  }

  private _getArtworkIDs() {
    this._apiInstance
      .get('public/collection/v1/search?hasImages=true&artistOrCulture=true&q=*')
      .then(response => {
        this._artworkIds = response.data.objectIDs;
      })
      .catch(error => {
        throw new Error(error.message);
      });
  }

  async createArtwork(objectId: number): Promise<Artwork> {
    let responseData = null;
    try {
      const response = await this._apiInstance.get(`public/collection/v1/objects/${objectId}`);
      responseData = response.data;
    } catch (error) {
      throw new Error("objectID doesn't exist");
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

  validArtwork(artwork: Artwork): boolean {
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
