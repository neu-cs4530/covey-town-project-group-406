import { Modal, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import AuctionHouseAreaController from '../../../classes/interactable/AuctionHouseAreaController';
import { useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { AuctionFloorArea, AuctionHouseArea } from '../../../types/CoveyTownSocket';
import AuctionHouseAreaInteractable from './AuctionHouseArea';
import SignupSignIn from '../../Login/ArtAuctionHouseLogin/SignupSignIn';

function AuctionHouseComponent({
  controller,
}: {
  controller: AuctionHouseAreaController;
}): JSX.Element {
  const [floors, setFloors] = useState<AuctionFloorArea[]>([]);
  const townController = useTownController();

  useEffect(() => {
    const handleChanged = (model: AuctionHouseArea) => {
      setFloors(model.floors);
    };

    controller.addListener('interactableAreaChanged', handleChanged);
    townController.createAuctionHouseArea({
      id: 'Art Auction House',
      occupants: [],
    });

    return () => {
      controller.removeListener('interactableAreaChanged', handleChanged);
    };
  }, [controller, townController]);

  return <div>Hello auction house! We have {floors.length} floors!</div>;
}

export default function AuctionHouseAreaWrapper(): JSX.Element {
  const auctionHouseArea = useInteractable<AuctionHouseAreaInteractable>('auctionHouseArea');
  const townController = useTownController();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (auctionHouseArea) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [townController, auctionHouseArea]);

  townController.addListener('loginStatus', success => {
    if (success) {
      setIsLoggedIn(true);
    }
  });

  townController.addListener('userLogoutStatus', success => {
    if (success) {
      setIsLoggedIn(false);
    }
  });

  const closeModal = useCallback(() => {
    if (auctionHouseArea) {
      townController.interactEnd(auctionHouseArea);
      // const controller = townController.getAuctionHouseAreaController(auctionHouseArea);
      // controller.leaveGame();
    }
  }, [townController, auctionHouseArea]);

  if (auctionHouseArea && auctionHouseArea.getData('type') === 'AuctionHouse') {
    return (
      <Modal
        isOpen={true}
        onClose={() => {
          closeModal();
          townController.unPause();
        }}
        closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          {isLoggedIn ? (
            <>
              <ModalHeader>{auctionHouseArea.name}</ModalHeader>
              <ModalCloseButton />
              <AuctionHouseComponent
                controller={townController.getAuctionHouseAreaController(auctionHouseArea)}
              />
            </>
          ) : (
            <>
              <ModalCloseButton />
              <SignupSignIn />
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
