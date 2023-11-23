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
      <CardActionArea
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}>
        <CardMedia
          component='img'
          height='200'
          image={artwork.primaryImage}
          alt={artwork.description}
          style={{ minHeight: 200, maxHeight: 200, overflow: 'hidden' }}
        />
        <CardContent style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography gutterBottom variant='h5' component='div' style={{ fontWeight: 700 }}>
            {artwork.title}
          </Typography>
          <Typography gutterBottom variant='subtitle1' component='div' style={{ fontWeight: 500 }}>
            {artwork.artist.name}
          </Typography>
          <div>{getAuctionStatus()}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexGrow: 1, alignItems: 'end' }}>
            <Button
              onClick={async () => {
                await handleClickJoinObserver(floor);
              }}>
              Join as Observer
            </Button>
            <Button
              style={{ backgroundColor: 'lightblue' }}
              onClick={async () => {
                await handleClickJoinFloorBidder(floor);
              }}>
              Join as Bidder
            </Button>
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AuctionFloorCard;
