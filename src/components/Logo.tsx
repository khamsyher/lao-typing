import Image from "next/image";

// Site logo (public/assets/logos/lao-typing.png, 401×369). Decorative: the site name is
// always shown as text next to it.
export default function Logo() {
  return (
    <Image
      src="/assets/logos/lao-typing.png"
      alt=""
      width={48}
      height={44}
      preload
      className="h-11 w-auto shrink-0 object-contain"
    />
  );
}
