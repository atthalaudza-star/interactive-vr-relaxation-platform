import StartFlow from "@/components/StartFlow";
import { loadStressOptions } from "@/lib/options";

export const dynamic = "force-dynamic";

export default async function MulaiPage() {
  const options = await loadStressOptions();
  return <StartFlow initialOptions={options} />;
}
