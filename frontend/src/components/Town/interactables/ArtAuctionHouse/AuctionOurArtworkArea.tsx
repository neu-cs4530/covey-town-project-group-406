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
import React from 'react';
import { Artwork, AuctionFloorArea } from '../../../../types/CoveyTownSocket';
import { AuctionArtwork } from './ArtAuctionHouseArea';

interface AuctionOurArtworkAreaProps {
  artworks: AuctionArtwork[];
  setArtworks: React.Dispatch<React.SetStateAction<AuctionArtwork[]>>;
  auctionFloors: AuctionFloorArea[];
  handlePutForAuction: (a: Artwork, bid: number) => Promise<void>;
  handleTakeDownAuction: (a: Artwork) => Promise<void>;
}

const AuctionOurArtworkArea = ({
  artworks,
  setArtworks,
  auctionFloors,
  handlePutForAuction,
  handleTakeDownAuction,
}: AuctionOurArtworkAreaProps) => {
  // const [ourArtworks, setOurArtworks] = useState<AuctionArtwork[]>(artworks.map(a => {return {...a, startingBid:a.purchasePrice}}))

  const handleAdd = async (artwork: AuctionArtwork, bid: number) => {
    await handlePutForAuction(artwork, bid);
  };

  const handleRemove = async (artwork: AuctionArtwork) => {
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
                  <Button onClick={async () => handleAdd(a, a.startingBid)}>Add</Button>
                )}
              </div>
              <div style={{ minWidth: 150, maxWidth: 150 }}>
                <NumberInput
                  value={a.startingBid}
                  onChange={e =>
                    setArtworks([
                      ...artworks.map(oa =>
                        oa.id === a.id ? { ...oa, startingBid: parseInt(e) } : oa,
                      ),
                    ])
                  }>
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
