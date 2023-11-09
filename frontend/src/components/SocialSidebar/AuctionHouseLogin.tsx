import useTownController from '../../hooks/useTownController';
import React from 'react';
export default function AuctionHouseLogin(): JSX.Element {
  const townController = useTownController();
  townController.addListener('loginStatus', () => {
    console.log('user logged in!');
  });
  const sendLoginCommand = () => {
    townController.sendLoginCommand();
  };
  return <button onClick={sendLoginCommand}>Login</button>;
}
