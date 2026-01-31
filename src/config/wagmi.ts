import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import { POLYGON_AMOY, POLYGON_MAINNET } from './contract'

const selectedNetwork = import.meta.env.VITE_NETWORK || 'amoy' // 'mainnet' or 'amoy'

const polygonRpcUrl = import.meta.env.VITE_RPC_URL || POLYGON_MAINNET.rpcUrls.default.http[0]
const amoyRpcUrl = import.meta.env.VITE_RPC_URL || POLYGON_AMOY.rpcUrls.default.http[0]
const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://0xrpc.io/sep'

const useMainnet = selectedNetwork === 'mainnet' || selectedNetwork === 'polygon'

const chains = useMainnet ? [POLYGON_MAINNET, sepolia] : [POLYGON_AMOY, sepolia]

const transports = {
  [POLYGON_MAINNET.id]: http(polygonRpcUrl),
  [POLYGON_AMOY.id]: http(amoyRpcUrl),
  [sepolia.id]: http(sepoliaRpcUrl),
}

export const config = createConfig({
    chains,
    connectors: [injected(), metaMask()],
    transports,
})