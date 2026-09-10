import Image from "next/image";

const iconSources = {
  "shopping-bag": "/brand/icons/shopping-bag.png",
  calendar: "/brand/icons/calendar.png",
  done: "/brand/icons/done.png",
  home: "/brand/icons/home.png",
  box: "/brand/icons/box.png",
  dog: "/brand/icons/dog.png",
  "cat-footprint": "/brand/icons/cat-footprint.png",
} as const;

export type PatitasIconName = keyof typeof iconSources;

export function PatitasIcon({ name, className = "" }: { name: PatitasIconName; className?: string }) {
  return <Image src={iconSources[name]} alt="" width={50} height={50} unoptimized aria-hidden="true" className={`object-contain ${className}`} />;
}
