import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React, { useCallback, useEffect } from 'react';
import AuctionHouseAreaController, {
  useAuctionHouseAreaArtwork,
} from '../../../classes/interactable/AuctionHouseAreaController';
import { useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import AuctionHouseAreaInteractable from './AuctionHouseArea';

function AuctionHouseComponent({
  controller,
}: {
  controller: AuctionHouseAreaController;
}): JSX.Element {
  const floors = useAuctionHouseAreaArtwork(controller);
  const townController = useTownController();

  useEffect(() => {
    townController.createAuctionHouseArea({ id: 'Art Auction House', occupants: [] });
  }, [townController]);

  return <div>Hello auction house! We have {floors.length} floors!</div>;
}

export default function AuctionHouseAreaWrapper(): JSX.Element {
  const auctionHouseArea = useInteractable<AuctionHouseAreaInteractable>('auctionHouseArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (auctionHouseArea) {
      townController.interactEnd(auctionHouseArea);
      // const controller = townController.getAuctionHouseAreaController(auctionHouseArea);
      // controller.leaveGame();
    }
  }, [townController, auctionHouseArea]);

  if (auctionHouseArea && auctionHouseArea.getData('type') === 'AuctionHouse') {
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{auctionHouseArea.name}</ModalHeader>
          <ModalCloseButton />
          <AuctionHouseComponent
            controller={townController.getAuctionHouseAreaController(auctionHouseArea)}
          />
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
