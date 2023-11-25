import React from 'react';
import { Artwork } from '../../types/CoveyTownSocket';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Image,
} from '@chakra-ui/react';
import { Typography } from '@material-ui/core';

interface UserArtworkProps {
  artwork: Artwork;
}

export default function UserArtwork({ artwork }: UserArtworkProps): JSX.Element {
  return (
    <Accordion allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton style={{ backgroundColor: 'lightgrey', borderRadius: 10 }}>
            <Box as='span' flex='1' textAlign='left'>
              <strong>{artwork.title}</strong> by {artwork.artist.name}
              <br />
              <strong>Your purchase price:</strong> {artwork.purchasePrice}
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
              {artwork.title}
            </Typography>
            <Typography variant='h6' style={{ fontWeight: 500 }}>
              by {artwork.artist.name}
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
            {artwork.culture && (
              <Typography variant='subtitle1' style={{ marginTop: 5 }}>
                <strong>Country of Origin</strong>: {artwork.countryOfOrigin}
              </Typography>
            )}
            {artwork.culture && (
              <Typography variant='subtitle1' style={{ marginTop: 5 }}>
                <strong>Country of Origin</strong>: {artwork.countryOfOrigin}
              </Typography>
            )}
          </div>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
