import { Heading, StackDivider, VStack } from '@chakra-ui/react';
import React from 'react';
import ConversationAreasList from './ConversationAreasList';
import PlayersList from './PlayersList';
import { ArtAuctionAccountInfoWrapper } from './ArtAuctionAccountInfo';
import LoginLogoutButton from './LoginLogoutButton';
import { Typography } from '@material-ui/core';

export default function SocialSidebar(): JSX.Element {
  return (
    <VStack
      align='left'
      spacing={2}
      border='2px'
      padding={2}
      marginLeft={2}
      borderColor='gray.500'
      height='100%'
      divider={<StackDivider borderColor='gray.200' />}
      borderRadius='4px'>
      <Heading fontSize='xl' as='h1'>
        Players In This Town
      </Heading>
      <PlayersList />
      <ConversationAreasList />
      <div>
        <Typography variant='subtitle1' style={{ fontWeight: 600 }}>
          Art Auction Account
        </Typography>
        <ArtAuctionAccountInfoWrapper />
        <LoginLogoutButton />
      </div>
    </VStack>
  );
}
