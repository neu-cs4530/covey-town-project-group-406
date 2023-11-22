/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Artwork } from '../types/CoveyTownSocket';
import APIUtils from './APIUtils';

describe('APIUtils tests', () => {
  let testArtwork: Artwork;
  let utils: APIUtils;
  beforeEach(() => {
    utils = new APIUtils();
    testArtwork = {
      description: 'Its the Mona Lisa',
      id: 1,
      primaryImage: 'monalisa.png',
      purchasePrice: 500000,
      department: 'The Mona Lisa Department',
      title: 'The mona lisa',
      culture: 'unknown',
      period: '1500',
      artist: { name: 'da Vinci' },
      medium: 'Canvas',
      countryOfOrigin: 'Italy',
      isBeingAuctioned: false,
      purchaseHistory: [],
    };
  });

  describe('validArtwork', () => {
    it('should have a primary image', () => {
      testArtwork.primaryImage = '';
      expect(utils.validArtwork(testArtwork)).toEqual(false);
    });
    it('should have a department', () => {
      testArtwork.department = '';
      expect(utils.validArtwork(testArtwork)).toEqual(false);
    });
    it('should have a title', () => {
      testArtwork.title = '';
      expect(utils.validArtwork(testArtwork)).toEqual(false);
    });
    it('should have a medium', () => {
      testArtwork.medium = '';
      expect(utils.validArtwork(testArtwork)).toEqual(false);
    });
    it('should have an artist name', () => {
      testArtwork.artist.name = '';
      expect(utils.validArtwork(testArtwork)).toEqual(false);
    });
    it('should have a description', () => {
      testArtwork.description = '';
      expect(utils.validArtwork(testArtwork)).toEqual(false);
    });
    it('should return true when all required fields are complete', () => {
      expect(utils.validArtwork(testArtwork)).toEqual(true);
    });
  });
});

describe('createArtwork Tests', () => {
  const validArtID = 188005;
  const invalidArtID = 24495;
  const nonExistantID = 12324324;
  const utils = new APIUtils();

  it('should create an artwork object for a vaild artwork ID', async () => {
    const artwork1 = await utils.createArtwork(validArtID);
    if (artwork1) {
      expect(artwork1.description).toEqual(
        `This piece of art is called 'Box' created by British Painter in 1832 using gold, rhinestones, enamel`,
      );
      expect(artwork1.id).toEqual(validArtID);
      expect(artwork1.primaryImage).toContain('https://images.metmuseum.org/CRDImages/es');
      expect(artwork1.purchasePrice).toEqual(0);
      expect(artwork1.department).toEqual('European Sculpture and Decorative Arts');
      expect(artwork1.title).toEqual('Box');
      expect(artwork1.culture).toBeUndefined;
      expect(artwork1.period).toBeUndefined;
      expect(artwork1.artist.name).toEqual('British Painter');
      expect(artwork1.medium).toEqual('Gold, rhinestones, enamel');
      expect(artwork1.countryOfOrigin).toBeUndefined;
      expect(artwork1.isBeingAuctioned).toEqual(false);
      expect(artwork1.purchaseHistory).toHaveLength(0);
    }
  });
  it(`should create an artwork object for an invalid artwork's ID`, async () => {
    const artwork1 = await utils.createArtwork(invalidArtID);
    if (artwork1) {
      expect(artwork1.description).toEqual(
        `This piece of art is called 'Miniature Netsuke Pistol' created by  in ca. 1615–1868 using `,
      );
      expect(artwork1.id).toEqual(invalidArtID);
      expect(artwork1.primaryImage).toEqual('');
      expect(artwork1.purchasePrice).toEqual(0);
      expect(artwork1.department).toEqual('Arms and Armor');
      expect(artwork1.title).toEqual('Miniature Netsuke Pistol');
      expect(artwork1.culture).toEqual('Japanese');
      expect(artwork1.period).toBeUndefined;
      expect(artwork1.artist.name).toEqual('');
      expect(artwork1.medium).toEqual('');
      expect(artwork1.countryOfOrigin).toEqual('Japan');
      expect(artwork1.isBeingAuctioned).toEqual(false);
      expect(artwork1.purchaseHistory).toHaveLength(0);
    }
  });
  it('should return undefined if no artwork exists with that ID', async () => {
    await expect(utils.createArtwork(nonExistantID)).toBeUndefined;
  });
});

describe('nextArtworks tests', () => {
  const utils = new APIUtils();
  let artworkList: Artwork[];
  jest.setTimeout(2147483647);
  beforeAll(async () => {
    artworkList = await utils.nextArtworks(0, 30);
  });
  it('should return a list of valid artworks', () => {
    artworkList.map(artwork => expect(utils.validArtwork(artwork)).toEqual(true));
    expect(artworkList.length).toBeLessThanOrEqual(30);
  });
});
