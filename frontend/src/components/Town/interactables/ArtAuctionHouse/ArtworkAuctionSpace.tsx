import {
  Badge,
  Button,
  Divider,
  Flex,
  ListItem,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  UnorderedList,
} from '@chakra-ui/react';
import { Typography } from '@material-ui/core';
import React from 'react';
import { AuctionFloorArea } from '../../../../types/CoveyTownSocket';

interface ArtworkAuctionSpaceProps {
  selectedFloor: AuctionFloorArea;
  bidAmount: number;
  userMoney: number;
  getSelectedFloor: () => AuctionFloorArea | undefined;
  handleMakeBid: (floor: AuctionFloorArea, bid: number) => Promise<void>;
  setBidAmount: (bidAmount: number) => void;
  weAreBidder: () => boolean;
}

const ArtworkAuctionSpace = ({
  selectedFloor,
  bidAmount,
  userMoney,
  getSelectedFloor,
  handleMakeBid,
  setBidAmount,
  weAreBidder,
}: ArtworkAuctionSpaceProps) => {
  const getAuctionStatusBadge = (floor: AuctionFloorArea) => {
    if (floor.status === 'IN_PROGRESS') {
      return <Badge colorScheme='green'>Auction in progress</Badge>;
    } else if (floor.status === 'WAITING_TO_START') {
      return <Badge colorScheme='purple'>Waiting to start the auction</Badge>;
    } else {
      return <Badge colorScheme='red'>Auction ended</Badge>;
    }
  };

  const getCurrentBid = () => {
    const floor = getSelectedFloor();
    if (floor?.status === 'WAITING_TO_START') {
      return (
        <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
          <strong>Starting bid</strong>: ${floor?.minBid.toLocaleString()}
        </Typography>
      );
    } else if (floor?.status === 'IN_PROGRESS') {
      if (floor !== undefined && floor.currentBid !== undefined) {
        return (
          <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
            <strong>Current bid</strong>: ${floor.currentBid.bid.toLocaleString()}
            <br />
            <strong>User</strong>: {floor?.currentBid.player.artAuctionAccount?.email}
          </Typography>
        );
      } else {
        return (
          <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
            <strong>Starting Bid: ${floor.minBid.toLocaleString()}</strong>
          </Typography>
        );
      }
    } else {
      if (floor !== undefined && floor.currentBid !== undefined) {
        return (
          <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
            <strong>Winning bid</strong>: ${floor.currentBid?.bid.toLocaleString()}
            <br />
            <strong>User</strong>: {floor.currentBid.player.artAuctionAccount?.email}
          </Typography>
        );
      } else {
        return (
          <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 24 }}>
            <strong>Auction ended</strong>
          </Typography>
        );
      }
    }
  };

  if (selectedFloor) {
    return (
      <div>
        <div>
          <Typography variant='h4' style={{ display: 'inline', fontWeight: 700 }}>
            Auction Space
          </Typography>
          <div style={{ display: 'inline', float: 'inline-end' }}>
            {getAuctionStatusBadge(getSelectedFloor() as AuctionFloorArea)}
          </div>
        </div>
        <Divider />
        <Typography variant='subtitle1' style={{ fontWeight: 400, marginTop: 15, fontSize: 24 }}>
          <strong>Auctioneer</strong>:{' '}
          {selectedFloor.auctioneer
            ? selectedFloor.auctioneer.artAuctionAccount?.email
            : 'Auction House'}
        </Typography>

        {getCurrentBid()}

        <Divider />

        <Typography variant='subtitle1' style={{ fontWeight: 400, marginTop: 5, fontSize: 30 }}>
          <strong>Time Left: {getSelectedFloor()?.timeLeft}</strong>
        </Typography>

        {weAreBidder() && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <Flex gap={12} padding={10} paddingLeft={0} alignItems={'center'}>
              <div>
                <NumberInput
                  onChange={valueString => setBidAmount(Number(valueString))}
                  value={bidAmount}
                  width={140}
                  max={userMoney}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </div>
              <Slider
                flex='1'
                focusThumbOnChange={false}
                value={bidAmount}
                onChange={valueString => setBidAmount(Number(valueString))}
                max={userMoney}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb fontSize='sm' boxSize={'80px'}>
                  {bidAmount.toLocaleString()}
                </SliderThumb>
              </Slider>
            </Flex>
            <Button
              onClick={async () => {
                await handleMakeBid(getSelectedFloor() as AuctionFloorArea, bidAmount);
              }}>
              Make Bid!
            </Button>
            <Divider />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'row', gap: 5, width: '100%' }}>
          <div style={{ width: '50%' }}>
            <Typography variant='subtitle1' style={{ fontWeight: 400, marginTop: 5, fontSize: 18 }}>
              <strong>Observers</strong>
            </Typography>
            {getSelectedFloor()?.observers.length === 0 ? (
              <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 16 }}>
                There are no current observers.
              </Typography>
            ) : (
              <UnorderedList>
                {getSelectedFloor()?.observers.map((o, idx) => (
                  <ListItem key={idx}>{o.artAuctionAccount?.email}</ListItem>
                ))}
              </UnorderedList>
            )}
          </div>
          <div style={{ width: '50%' }}>
            <Typography variant='subtitle1' style={{ fontWeight: 400, marginTop: 5, fontSize: 18 }}>
              <strong>Bidders</strong>
            </Typography>
            {getSelectedFloor()?.bidders.length === 0 ? (
              <Typography variant='subtitle1' style={{ fontWeight: 400, fontSize: 16 }}>
                There are no current bidders.
              </Typography>
            ) : (
              <UnorderedList>
                {getSelectedFloor()?.bidders.map((o, idx) => (
                  <ListItem key={idx}>{o.artAuctionAccount?.email}</ListItem>
                ))}
              </UnorderedList>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

export default ArtworkAuctionSpace;
