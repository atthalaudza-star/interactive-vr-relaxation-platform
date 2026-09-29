import {
  Activity, BarChart3, BatteryMedium, BedDouble, BookOpen, Box, BriefcaseBusiness,
  Check, Clock3, Cloud, DollarSign, Flame, Focus, GraduationCap, Heart, HeartPulse, Home,
  Leaf, Lightbulb, LockKeyhole, Maximize2, Menu, MessageCircle, Monitor, MoonStar, Pause, Play, School,
  Snowflake, Sparkles, Timer, Trees, Users, Volume2, VolumeX, Waves, X,
  type LucideIcon,
} from "lucide-react";

const icons = {
  activity: Activity, chart: BarChart3, battery: BatteryMedium, bed: BedDouble,
  book: BookOpen, box: Box, briefcase: BriefcaseBusiness, check: Check, clock: Clock3,
  cloud: Cloud, dollar: DollarSign, fire: Flame, focus: Focus, school: GraduationCap,
  heart: Heart, health: HeartPulse, home: Home, leaf: Leaf, lightbulb: Lightbulb, lock: LockKeyhole,
  maximize: Maximize2, menu: Menu, message: MessageCircle, monitor: Monitor, moon: MoonStar, pause: Pause, play: Play,
  campus: School, snow: Snowflake, sparkles: Sparkles, timer: Timer, trees: Trees,
  users: Users, volume: Volume2, mute: VolumeX, waves: Waves, close: X,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export default function AppIcon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}
