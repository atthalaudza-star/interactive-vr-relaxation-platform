import Image from "next/image";
import type { RelaxTheme } from "@/lib/themes";

export default function ThemeImage({
  theme,
  className = "object-cover",
  sizes = "(max-width: 640px) 100vw, 33vw",
}: {
  theme: RelaxTheme;
  className?: string;
  sizes?: string;
}) {
  return <Image src={theme.image} alt={`Suasana ${theme.name}`} fill className={className} sizes={sizes} />;
}
