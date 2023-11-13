import React from "react"
import { Artwork } from "../../types/CoveyTownSocket"
import { Box, Heading, Image } from "@chakra-ui/react"
type Props = {
    userArtworks: Artwork[]
  }
export default function UserArtworks({userArtworks}: Props): JSX.Element {



    return (
        <Box>
        {userArtworks.map((artwork: Artwork) => {
            return (
            <Box>
                <Heading as='h2' fontSize='lg'>{artwork.id}</Heading>
                <Image src={artwork.primaryImage} alt="not found"></Image>
            </Box>
            )
        }
        )}
        </Box>
    )
}