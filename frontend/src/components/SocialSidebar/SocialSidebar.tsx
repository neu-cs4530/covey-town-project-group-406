import { Heading, StackDivider, VStack } from '@chakra-ui/react';
import React from 'react';
import ConversationAreasList from './ConversationAreasList';
import PlayersList from './PlayersList';
import { ArtAuctionAccountInfoWrapper } from './ArtAuctionAccountInfo';
import { SingupWrapper } from './SignupForm';
import { LoginWrapper } from './LoginForm';
import LogoutButton from './LogoutButton';

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
      <ArtAuctionAccountInfoWrapper />
      <SingupWrapper />
      <LoginWrapper />
      <LogoutButton />
    </VStack>
  );
}
