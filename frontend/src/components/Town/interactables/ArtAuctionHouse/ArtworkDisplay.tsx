import React from 'react';
import { Typography } from '@material-ui/core';
import { Image } from '@chakra-ui/react';
import { Artwork } from '../../../../types/CoveyTownSocket';

interface ArtworkDisplayProps {
  artwork: Artwork;
}

const ArtworkDisplay = ({ artwork }: ArtworkDisplayProps) => {
  const getArtistName = () => {
    if (artwork.artist.wikiUrl !== undefined) {
      return (
        <a
          href={artwork.artist.wikiUrl}
          style={{ textDecoration: 'underline', color: 'teal' }}
          target='_blank'
          rel='noreferrer'>
          {artwork.artist.name}
        </a>
      );
    } else {
      return artwork.artist.name;
    }
  };

  return (
    <div
      style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'left' }}>
      <Typography variant='h4' style={{ fontWeight: 700 }}>
        {artwork.title}
      </Typography>
      <Typography variant='h6' style={{ fontWeight: 500 }}>
        by {getArtistName()}
      </Typography>
      <div style={{ width: '95%', marginTop: 20 }}>
        <Image src={artwork.primaryImage} alt={artwork.title} />
      </div>
      <Typography variant='subtitle1' style={{ marginTop: 15 }}>
        <strong>Description</strong>: {artwork.description}
      </Typography>
      <Typography variant='subtitle1' style={{ marginTop: 5 }}>
        <strong>Medium</strong>: {artwork.medium}
      </Typography>
      <Typography variant='subtitle1' style={{ marginTop: 5 }}>
        <strong>The MET Museum Department</strong>: {artwork.department}
      </Typography>
    </div>
  );
};

export default ArtworkDisplay;
