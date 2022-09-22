import { Trans, useTranslation } from "react-i18next"
import { SMaxButton } from "sections/pools/pool/modals/joinFarm/PoolJoinFarm.styled"
import { Box } from "components/Box/Box"
import { Text } from "components/Typography/Text/Text"
import { AprFarm } from "utils/apr"
import { PoolToken } from "@galacticcouncil/sdk"
import { AssetInput } from "components/AssetInput/AssetInput"
import { DualAssetIcons } from "components/DualAssetIcons/DualAssetIcons"
import { Button } from "components/Button/Button"
import { useStore } from "state/store"
import { useApiPromise } from "utils/network"
import { usePoolShareToken } from "api/pools"
import { useTokenBalance } from "api/balances"
import { useForm, Controller } from "react-hook-form"
import { FormValues } from "utils/types"
import { WalletConnectButton } from "sections/wallet/connect/modal/WalletConnectButton"
import { getAssetLogo } from "components/AssetIcon/AssetIcon"

export const PoolJoinFarmDeposit = (props: {
  poolId: string
  assetIn: PoolToken
  assetOut: PoolToken
  farm: AprFarm
}) => {
  const { t } = useTranslation()
  const { createTransaction } = useStore()
  const api = useApiPromise()

  const shareToken = usePoolShareToken(props.poolId)

  const { account } = useStore()
  const shareTokenBalance = useTokenBalance(shareToken.data, account?.address)

  const form = useForm<{ value: string }>({})

  async function handleSubmit(data: FormValues<typeof form>) {
    if (!account) throw new Error("No account found")

    const tx = api.tx.liquidityMining.depositShares(
      props.farm.globalFarm.id,
      props.farm.yieldFarm.id,
      {
        assetIn: props.assetIn.id,
        assetOut: props.assetOut.id,
      },
      data.value,
    )

    return await createTransaction({
      hash: tx.hash.toString(),
      tx,
    })
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <Box bg="backgroundGray800" p={20} mt={20} css={{ borderRadius: 12 }}>
        <Box flex acenter spread mb={11}>
          <Text fw={600} lh={22} color="primary200">
            {t("farms.deposit.title")}
          </Text>
          <Box flex acenter>
            <Text fs={12} lh={16} mr={5} color="white">
              <Trans
                t={t}
                i18nKey="farms.deposit.balance"
                tOptions={{
                  balance: shareTokenBalance.data?.balance ?? "-",
                }}
              >
                <span css={{ opacity: 0.7 }} />
              </Trans>
            </Text>
            <SMaxButton
              size="micro"
              text={t("selectAsset.button.max")}
              capitalize
              onClick={() => {
                const balance = shareTokenBalance.data?.balance

                if (balance != null) {
                  form.setValue("value", balance.toString())
                }
              }}
            />
          </Box>
        </Box>
        <Box flex acenter>
          <DualAssetIcons
            firstIcon={{ icon: getAssetLogo(props.assetIn.symbol) }}
            secondIcon={{ icon: getAssetLogo(props.assetOut.symbol) }}
          />
          <Box flex column mr={20} css={{ flexShrink: 0 }}>
            <Text fw={700} fs={16}>
              {props.assetIn.symbol}/{props.assetOut.symbol}
            </Text>
            <Text fw={500} fs={12} color="neutralGray500">
              {t("farms.deposit.assetType")}
            </Text>
          </Box>

          <Controller
            name="value"
            control={form.control}
            rules={{
              validate: {
                minDeposit: (value) => {
                  const minDeposit =
                    props.farm.globalFarm.minDeposit.toBigNumber()

                  return !minDeposit.lte(value)
                    ? t("farms.deposit.error.minDeposit", { minDeposit })
                    : undefined
                },
              },
            }}
            render={({
              field: { value, onChange, name },
              formState: { errors },
            }) => (
              <AssetInput
                name={name}
                label={name}
                value={value}
                css={{ flexGrow: 1 }}
                error={errors.value?.message}
                onChange={onChange}
              />
            )}
          />
        </Box>
      </Box>

      <Box flex mt={20} css={{ justifyContent: "flex-end" }}>
        {account ? (
          <Button type="submit" variant="primary">
            {t("farms.deposit.submit")}
          </Button>
        ) : (
          <WalletConnectButton />
        )}
      </Box>
    </form>
  )
}
