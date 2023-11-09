import useTownController from '../../hooks/useTownController';
import React from 'react';
export default function AuctionHouseLogin(): JSX.Element {
  const townController = useTownController();
  const sendLoginCommand = () => {
    //townController.sendLoginCommand();
  };
  return <button>Login</button>;
}
