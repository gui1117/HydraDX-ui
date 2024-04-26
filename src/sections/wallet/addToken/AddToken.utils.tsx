import { useMutation } from "@tanstack/react-query"
import { ExternalAssetCursor } from "@galacticcouncil/apps"
import { useRpcProvider } from "providers/rpcProvider"
import { ToastMessage, useStore } from "state/store"
import {
  HydradxRuntimeXcmAssetLocation,
  XcmV3Junction,
} from "@polkadot/types/lookup"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { TOAST_MESSAGES } from "state/toasts"
import { Trans, useTranslation } from "react-i18next"
import { mergeArrays } from "utils/rx"
import { ASSET_HUB_ID, PENDULUM_ID } from "api/externalAssetRegistry"

export const SELECTABLE_PARACHAINS_IDS = [ASSET_HUB_ID, PENDULUM_ID]

export const PARACHAIN_CONFIG: {
  [x: number]: {
    palletInstance: string
    network: string
    parents: string
    interior: HydradxRuntimeXcmAssetLocation["interior"]["type"]
  }
} = {
  [ASSET_HUB_ID]: {
    palletInstance: "50",
    network: "polkadot",
    parents: "1",
    interior: "X3",
  },
}

export type TExternalAsset = {
  id: string
  decimals: number
  symbol: string
  name: string
  origin: number
}

export type InteriorTypes = {
  [x: string]: InteriorProp[]
}

export type InteriorProp = {
  [K in XcmV3Junction["type"]]: { [P in K]: any }
}[XcmV3Junction["type"]]

export const isGeneralKey = (
  prop: InteriorProp,
): prop is { GeneralKey: string } => {
  return typeof prop !== "string" && "GeneralKey" in prop
}

export type TExternalAssetInput = {
  parents: string
  interior: InteriorTypes | string
}

export const useRegisterToken = ({
  onSuccess,
  assetName,
}: {
  onSuccess: () => void
  assetName: string
}) => {
  const { api } = useRpcProvider()
  const { createTransaction } = useStore()
  const { t } = useTranslation()

  return useMutation(async (assetInput: TExternalAssetInput) => {
    const toast = TOAST_MESSAGES.reduce((memo, type) => {
      const msType = type === "onError" ? "onLoading" : type
      memo[type] = (
        <Trans
          t={t}
          i18nKey={`wallet.addToken.toast.register.${msType}`}
          tOptions={{
            name: assetName,
          }}
        >
          <span />
          <span className="highlight" />
        </Trans>
      )
      return memo
    }, {} as ToastMessage)

    return await createTransaction(
      {
        tx: api.tx.assetRegistry.registerExternal(assetInput),
      },
      { toast, onSuccess },
    )
  })
}

type Store = {
  tokens: TExternalAsset[]
  addToken: (TokensConversion: TExternalAsset) => void
  isAdded: (id: string | undefined) => boolean
}

export const useUserExternalTokenStore = create<Store>()(
  persist(
    (set, get) => ({
      tokens: [
        {
          decimals: 10,
          id: "30",
          name: "DED",
          origin: 1000,
          symbol: "DED",
        },
        {
          decimals: 10,
          id: "23",
          name: "PINK",
          origin: 1000,
          symbol: "PINK",
        },
        {
          decimals: 4,
          id: "18",
          name: "DOTA",
          origin: 1000,
          symbol: "DOTA",
        },
      ],
      addToken: (token) =>
        set((store) => {
          const latest = { tokens: [...store.tokens, token] }
          ExternalAssetCursor.reset({
            state: latest,
            version: 0.2,
          })
          return latest
        }),
      isAdded: (id) =>
        id ? get().tokens.some((token) => token.id === id) : false,
    }),
    {
      name: "external-tokens",
      version: 0.2,
      merge(persistedState, currentState) {
        if (!persistedState) return currentState

        const defaultTokens = currentState.tokens
        const { tokens: storedTokens } = persistedState as Store
        const mergedTokens = mergeArrays(storedTokens, defaultTokens, "id")

        return { ...currentState, tokens: mergedTokens }
      },
    },
  ),
)
