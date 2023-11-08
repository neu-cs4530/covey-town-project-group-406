import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React, { useCallback } from 'react';
import { useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import ArtAuctionHouseAreaInteractable from './ArtAuctionHouseArea';

function ArtAuctionHouseComponent(): JSX.Element {
    return (
        <div>
            Hello auction house!
        </div>
    );
}

export default function ArtAuctionHouseAreaWrapper(): JSX.Element {
    const artAuctionHouseArea = useInteractable<ArtAuctionHouseAreaInteractable>('artAuctionHouseArea');
    const townController = useTownController();
    const closeModal = useCallback(() => {
      if (artAuctionHouseArea) {
        townController.interactEnd(artAuctionHouseArea);
        const controller = townController.getArtAuctionHouseAreaController(artAuctionHouseArea);
        // controller.leaveGame();
      }
    }, [townController, artAuctionHouseArea]);
  
    if (artAuctionHouseArea && artAuctionHouseArea.getData('type') === 'ArtAuctionHouse') {
      return (
        <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{artAuctionHouseArea.name}</ModalHeader>
            <ModalCloseButton />
            <ArtAuctionHouseComponent />
          </ModalContent>
        </Modal>
      );
    }
    return <></>;
  }