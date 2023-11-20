import React from 'react';
import { Typography } from '@material-ui/core';
import { Image } from '@chakra-ui/react';
import { Artwork } from '../../../../types/CoveyTownSocket';

interface ArtworkDisplayProps {
  artwork: Artwork;
}

const ArtworkDisplay = ({ artwork }: ArtworkDisplayProps) => {
  return (
    <div
      style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'left' }}>
      <Typography variant='h4' style={{ fontWeight: 700 }}>
        {artwork.title}
      </Typography>
      <Typography variant='h6' style={{ fontWeight: 500 }}>
        by {artwork.artist.name}
      </Typography>
      <div style={{ width: '95%', marginTop: 20 }}>
        <Image src={artwork.primaryImage} alt={artwork.title} />
      </div>
    </div>
  );
};

export default ArtworkDisplay;