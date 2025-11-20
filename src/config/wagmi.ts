import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { POLYGON_AMOY } from './contract'

export const config = createConfig({
  chains: [POLYGON_AMOY, sepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [POLYGON_AMOY.id]: http(),
    [sepolia.id]: http(),
  },
})
