import { createFileRoute } from '@tanstack/react-router'
import { InspectionsContent } from '@/features/inspections/components/inspections-content'

export const Route = createFileRoute('/_auth/hives/$hiveId/inspections')({
  component: InspectionListPage,
})

function InspectionListPage() {
  const { hiveId } = Route.useParams()
  return <InspectionsContent hiveId={hiveId} />
}
