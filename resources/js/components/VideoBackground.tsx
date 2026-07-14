type Props = {
  src?: string;
};

export default function VideoBackground({ src = '/images/SRCBBG1.mp4' }: Props) {
  return (
    <video
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
