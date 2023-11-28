import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Image,
  Button,
} from '@chakra-ui/react';
import { Typography } from '@material-ui/core';
import React, { useState } from 'react';
import { Artwork, AuctionFloorArea } from '../../../../types/CoveyTownSocket';

/**
 * Information needed for rendering AuctionOurArtworkArea
 */
interface AuctionOurArtworkAreaProps {
  artworks: Artwork[];
  auctionFloors: AuctionFloorArea[];
  handlePutForAuction: (a: Artwork, bid: number) => Promise<void>;
  handleTakeDownAuction: (a: Artwork) => Promise<void>;
}

/**
 * Renders the floor when user is auctioning their own artwork
 */
const AuctionOurArtworkArea = ({
  artworks,
  auctionFloors,
  handlePutForAuction,
  handleTakeDownAuction,
}: AuctionOurArtworkAreaProps) => {
  const initState: Map<number, number> = new Map();

  artworks.forEach(artwork => initState.set(artwork.id, artwork.purchasePrice));

  const [startingPrices, setStartingPrices] = useState(initState);

  // puts artwork up for auction
  const handleAdd = async (artwork: Artwork, bid: number) => {
    await handlePutForAuction(artwork, bid);
  };

  // removes auction floor of the given artwork
  const handleRemove = async (artwork: Artwork) => {
    await handleTakeDownAuction(artwork);
  };

  return (
    <div>
      <Stack>
        {artworks.map(a => {
          return (
            <div
              key={a.id}
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
              <div style={{ minWidth: 100 }}>
                {a.isBeingAuctioned ? (
                  <Button
                    disabled={
                      auctionFloors.find(f => f.artBeingAuctioned.id === a.id)?.status !==
                      'WAITING_TO_START'
                    }
                    onClick={async () => handleRemove(a)}>
                    Remove
                  </Button>
                ) : (
                  <Button onClick={async () => handleAdd(a, startingPrices.get(a.id) as number)}>
                    Add
                  </Button>
                )}
              </div>
              <div style={{ minWidth: 150, maxWidth: 150 }}>
                <NumberInput
                  onChange={valueString => {
                    startingPrices.set(a.id, Number(valueString));
                    setStartingPrices(new Map(startingPrices));
                  }}
                  value={startingPrices.get(a.id)}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </div>
              <div style={{ flexGrow: 1 }}>
                <Accordion allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box as='span' flex='1' textAlign='left'>
                          <strong>{a.title}</strong> by {a.artist.name}
                          <br />
                          <strong>Your purchase price:</strong> {a.purchasePrice}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'left',
                        }}>
                        <Typography variant='h4' style={{ fontWeight: 700 }}>
                          {a.title}
                        </Typography>
                        <Typography variant='h6' style={{ fontWeight: 500 }}>
                          by {a.artist.name}
                        </Typography>
                        <div style={{ width: '95%', marginTop: 20 }}>
                          <Image src={a.primaryImage} alt={a.title} />
                        </div>
                        <Typography variant='subtitle1' style={{ marginTop: 15 }}>
                          <strong>Description</strong>: {a.description}
                        </Typography>
                        <Typography variant='subtitle1' style={{ marginTop: 5 }}>
                          <strong>Medium</strong>: {a.medium}
                        </Typography>
                        <Typography variant='subtitle1' style={{ marginTop: 5 }}>
                          <strong>The MET Museum Department</strong>: {a.department}
                        </Typography>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          );
        })}
      </Stack>
    </div>
  );
};

export default AuctionOurArtworkArea;
