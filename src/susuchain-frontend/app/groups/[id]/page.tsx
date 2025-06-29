import { GroupDetailClient } from './client'

export async function generateStaticParams() {
  return [{ id: "placeholder" }]
}

export default function GroupDetailPage() {
  return <GroupDetailClient />
}
