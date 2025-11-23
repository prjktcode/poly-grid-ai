import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { POLYGON_AMOY } from './contract'

const amoyRpcUrl =
    import.meta.env.VITE_RPC_URL || POLYGON_AMOY.rpcUrls.default.http[0]
const sepoliaRpcUrl =
    import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://0xrpc.io/sep'

export const config = createConfig({
    chains: [POLYGON_AMOY, sepolia],
    connectors: [injected(), metaMask()],
    transports: {
        [POLYGON_AMOY.id]: http(amoyRpcUrl),
        [sepolia.id]: http(sepoliaRpcUrl),
    },
})