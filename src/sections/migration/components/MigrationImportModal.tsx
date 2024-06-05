import { Button } from "components/Button/Button"
import { Modal } from "components/Modal/Modal"
import { Separator } from "components/Separator/Separator"
import { Text } from "components/Typography/Text/Text"
import { FC, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  importToLocalStorage,
  useMigrationStore,
} from "sections/migration/MigrationProvider.utils"
import MigrationLogo from "assets/icons/migration/MigrationLogo.svg?react"

export const MigrationImportModal: FC<{ data?: string }> = ({ data }) => {
  const { t } = useTranslation()
  const [lastImportDate, setLastImportDate] = useState<Date | null>(null)
  const { migrationCompleted, setMigrationCompleted } = useMigrationStore()

  const reloadAppWithTimestamp = useCallback(
    (date: string) => {
      setMigrationCompleted(date)
      window.location.href = window.location.origin
    },
    [setMigrationCompleted],
  )

  useEffect(() => {
    const migrationCompletedOn =
      migrationCompleted && migrationCompleted !== "0"
        ? new Date(migrationCompleted)
        : null

    if (migrationCompletedOn && !!data) {
      setLastImportDate(new Date(migrationCompletedOn))
      return
    } else if (!!data) {
      importToLocalStorage(data)
    }

    reloadAppWithTimestamp(data ? new Date().toISOString() : "0")
  }, [data, migrationCompleted, reloadAppWithTimestamp])

  if (!lastImportDate) {
    return null
  }

  return (
    <Modal open headerVariant="GeistMono">
      <MigrationLogo sx={{ mx: "auto" }} />
      <Text tAlign="center" font="GeistMono" fs={19} sx={{ mt: 12 }}>
        {t("migration.import.title")}
      </Text>
      <Text
        tAlign="center"
        sx={{ mt: 12, maxWidth: 500, mx: "auto" }}
        color="basic400"
      >
        {t("migration.import.description", { date: lastImportDate })}
      </Text>
      <Separator
        sx={{ mx: [-20, -32], mt: ["auto", 50], mb: [12, 30], width: "auto" }}
        color="darkBlue401"
      />
      <div sx={{ flex: "row", justify: "space-between" }}>
        <Button
          onClick={() => {
            window.location.href = window.location.origin
          }}
        >
          {t("toast.close")}
        </Button>
        {data && (
          <Button
            variant="mutedError"
            onClick={() => {
              importToLocalStorage(data)
              reloadAppWithTimestamp(new Date().toISOString())
            }}
          >
            {t("migration.import.button")}
          </Button>
        )}
      </div>
    </Modal>
  )
}
