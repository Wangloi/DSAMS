type Props = {
    src?: string;
    poster?: string;
    className?: string;
};

export default function VideoBackground({
    src = '/images/SRCBBG1.mp4',
    poster = '/images/SRCBBG.jpg',
    className = 'absolute inset-0 h-full w-full object-cover',
}: Props) {
    return (
        <video
            className={className}
            autoPlay
            muted
            loop
            playsInline
            poster={poster}
        >
            <source src={src} type="video/mp4" />
        </video>
    );
}

