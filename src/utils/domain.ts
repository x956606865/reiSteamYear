export const isShareDomain = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'share.moukeer.com';
};
