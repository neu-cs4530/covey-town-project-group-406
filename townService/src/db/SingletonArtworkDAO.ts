import ArtworkDAO from './ArtworkDAO';

export default class SingletonArtworkDAO {
  private static _dao: ArtworkDAO | undefined;

  private constructor() {
    SingletonArtworkDAO._dao = undefined;
  }

  public static instance(): ArtworkDAO {
    if (SingletonArtworkDAO._dao === undefined) {
      SingletonArtworkDAO._dao = new ArtworkDAO();
    }
    return SingletonArtworkDAO._dao;
  }
}
