import React from "react"
import { Artwork } from "../../types/CoveyTownSocket"
import { Box, Heading, Image, StackDivider, VStack } from "@chakra-ui/react"
type Props = {
    userArtworks: Artwork[]
  }
export default function UserArtworks({userArtworks}: Props): JSX.Element {
    return (
    <VStack
      align='left'
      height='100%'
      divider={<StackDivider borderColor='gray.200' />}
      >

        {userArtworks.map((artwork: Artwork) => {
            return (
            <Box>
                <Heading as='h3' fontSize='m'>title: {artwork.title}</Heading>
                <Heading as='h3' fontSize='m'>artist: {artwork.artist}</Heading>
                <Image src={artwork.primaryImage} alt="not found"></Image>
            </Box>
            )}
        )}

    </VStack>
    )
}