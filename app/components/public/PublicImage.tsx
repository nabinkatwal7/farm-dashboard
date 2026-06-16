import Image, { type ImageProps } from "next/image";

export default function PublicImage(props: ImageProps) {
  return <Image {...props} unoptimized />;
}
