import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  variant?: "full" | "icon";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({ variant = "full", className, imageClassName, priority = false }: BrandLogoProps) {
  if (variant === "icon") {
    return (
      <Image
        src="/branding/icon-sobaya.png"
        alt="SOBAYA"
        width={44}
        height={44}
        priority={priority}
        className={cn("h-11 w-11 rounded-xl object-contain", imageClassName, className)}
      />
    );
  }

  return (
    <Image
      src="/branding/logo-sobaya.png"
      alt="SOBAYA"
      width={190}
      height={49}
      priority={priority}
      className={cn("h-auto w-[150px] object-contain md:w-[170px]", imageClassName, className)}
    />
  );
}
