import React, { useState } from 'react';
import useTownController from '../../hooks/useTownController';
import { signOut } from 'firebase/auth';
import auth from '../../classes/FirestoreConfig';
import { Button, useToast } from '@chakra-ui/react';

export default function ArtAuctionAccountInfo(): JSX.Element {
  const townController = useTownController();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('')
  townController.addListener('loginStatus', success => {
    if (success) {
      if (townController.ourPlayer.artAuctionAccount) {
        setUser(townController.ourPlayer.artAuctionAccount?.email)
        setIsLoggedIn(true)
      }
    }
  })

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsLoggedIn(false);
    }
  })

  if (isLoggedIn) {
    return (
      <div>currently signed in as {user}</div>
    );
  } else {
    return <div>Currently not signed in</div>
  }

}