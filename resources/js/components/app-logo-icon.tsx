import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return <img {...props} src="/images/DSALOGO.ico" alt="DSA Logo" />;
}
