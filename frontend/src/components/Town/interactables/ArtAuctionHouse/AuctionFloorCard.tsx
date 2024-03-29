import React from 'react';
import { Badge, Button } from '@chakra-ui/react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@material-ui/core';
import { Artwork, AuctionFloorArea } from '../../../../types/CoveyTownSocket';

/**
 * Interface of information AuctionFloorCard needs in order to render
 */
interface AuctionFloorCardProps {
  floor: AuctionFloorArea;
  weAreOwner: boolean;
  handleClickJoinObserver: (floor: AuctionFloorArea) => Promise<void>;
  handleClickJoinFloorBidder: (floor: AuctionFloorArea) => Promise<void>;
  handleTakeDownAuction: (artwork: Artwork) => Promise<void>;
}

/**
 * Renders the AuctionFloorCard
 *
 * Renders: a badge with the bid floor's status, bid price, the image and
 * buttons that allow users to join as a bidder or observer
 */
const AuctionFloorCard = ({
  floor,
  weAreOwner,
  handleClickJoinObserver,
  handleClickJoinFloorBidder,
  handleTakeDownAuction,
}: AuctionFloorCardProps) => {
  const artwork = floor.artBeingAuctioned;

  // renders a badge with the floor's status
  const getAuctionStatus = () => {
    if (floor.status === 'IN_PROGRESS') {
      return <Badge colorScheme='green'>Auction in progress</Badge>;
    } else if (floor.status === 'WAITING_TO_START') {
      return <Badge colorScheme='purple'>Waiting to start the auction</Badge>;
    } else {
      return <Badge colorScheme='red'>Auction ended</Badge>;
    }
  };

  // returns the current or starting bid price depending on if the bidding has started
  const getCurrentBidPrice = () => {
    if (floor.currentBid !== undefined) {
      return 'Current bid: $' + floor.currentBid.bid.toLocaleString();
    } else {
      return 'Starting bid: $' + floor.minBid.toLocaleString();
    }
  };

  return (
    <Card style={{ maxWidth: 345, minWidth: 345 }}>
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
        <CardContent
          style={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Typography gutterBottom variant='h5' component='div' style={{ fontWeight: 700 }}>
            {artwork.title}
          </Typography>
          <Typography gutterBottom variant='subtitle1' component='div' style={{ fontWeight: 500 }}>
            {artwork.artist.name}
          </Typography>
          <div>{getAuctionStatus()}</div>
          <Typography
            gutterBottom
            variant='body1'
            component='div'
            style={{ fontWeight: 400, marginTop: 10 }}>
            {getCurrentBidPrice()}
          </Typography>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexGrow: 1, alignItems: 'end' }}>
            <Button
              onClick={async () => {
                await handleClickJoinObserver(floor);
              }}>
              Join as Observer
            </Button>
            {weAreOwner ? (
              <Button
                style={{ backgroundColor: 'pink' }}
                disabled={floor.status !== 'WAITING_TO_START'}
                onClick={async () => {
                  await handleTakeDownAuction(floor.artBeingAuctioned);
                }}>
                Take down Auction
              </Button>
            ) : (
              <Button
                style={{ backgroundColor: 'lightblue' }}
                onClick={async () => {
                  await handleClickJoinFloorBidder(floor);
                }}>
                Join as Bidder
              </Button>
            )}
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default AuctionFloorCard;
