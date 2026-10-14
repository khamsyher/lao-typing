import Image from "next/image";
import logo from "../../public/assets/logos/lao-typing.png";

// Site logo. Importing the file (instead of using "/assets/…" as a string) gives it a
// content-hashed URL and its real size: replacing the PNG shows up immediately, with no
// stale copy in the image cache or the browser. Decorative: the site name is shown as text.
export default function Logo() {
  return <Image src={logo} alt="" preload sizes="48px" className="size-12 shrink-0 object-contain" />;
}
