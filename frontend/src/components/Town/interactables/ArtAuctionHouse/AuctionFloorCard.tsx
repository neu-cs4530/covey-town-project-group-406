import React from 'react';
import { Badge, Button } from '@chakra-ui/react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@material-ui/core';
import { AuctionFloorArea } from '../../../../types/CoveyTownSocket';

interface AuctionFloorCardProps {
  floor: AuctionFloorArea;
  handleClickJoinObserver: (floor: AuctionFloorArea) => Promise<void>;
  handleClickJoinFloorBidder: (floor: AuctionFloorArea) => Promise<void>;
}

const AuctionFloorCard = ({
  floor,
  handleClickJoinObserver,
  handleClickJoinFloorBidder,
}: AuctionFloorCardProps) => {
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
    <Card style={{ maxWidth: 345 }}>
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
          <Button
            onClick={async () => {
              await handleClickJoinObserver(floor);
            }}>
            Join as Observer
          </Button>
          <Button
            onClick={async () => {
              await handleClickJoinFloorBidder(floor);
            }}>
            Join as Bidder
          </Button>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AuctionFloorCard;
