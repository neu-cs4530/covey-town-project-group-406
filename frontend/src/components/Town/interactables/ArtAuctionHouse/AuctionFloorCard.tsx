import React from 'react';
import { Badge } from '@chakra-ui/react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@material-ui/core';
import { AuctionFloorArea } from '../../../../types/CoveyTownSocket';

interface AuctionFloorCardProps {
  floor: AuctionFloorArea;
  handleClick: (floor: AuctionFloorArea) => void;
}

const AuctionFloorCard = ({ floor, handleClick }: AuctionFloorCardProps) => {
  const artwork = floor.artBeingAuctioned;

  const getAuctionStatus = () => {
    if (floor.status === 'IN_PROGRESS') {
      return <Badge colorScheme='green'>Auction in progress</Badge>;
    } else if (floor.status === 'WAITING_TO_START') {
      return <Badge colorScheme='purple'>Waiting to start the auction</Badge>;
    } else {
      return <Badge colorScheme='red'>Auction ended</Badge>;
    }
  };

  return (
    <Card style={{ maxWidth: 345 }} onClick={() => handleClick(floor)}>
      <CardActionArea>
        <CardMedia
          component='img'
          height='140'
          image={artwork.primaryImage}
          alt={artwork.description}
        />
        <CardContent>
          <Typography gutterBottom variant='h5' component='div' style={{ fontWeight: 700 }}>
            {artwork.title}
          </Typography>
          <Typography gutterBottom variant='subtitle1' component='div' style={{ fontWeight: 500 }}>
            {artwork.artist.name}
          </Typography>
          {getAuctionStatus()}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AuctionFloorCard;