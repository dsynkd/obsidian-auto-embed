export const regexUrl = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi

export function isURL(str: string) : boolean {
    let url: URL;

    try {
        url = new URL(str);
    } catch {
        return false;
    }
    
    return url.protocol === "http:" || url.protocol === "https:";
}

export function isVaultResourceURL(str: string): boolean {
    let url: URL;

    try {
        url = new URL(str);
    } catch {
        return false;
    }

    return url.protocol === "app:" || url.protocol === "file:";
}

export function isLinkToImage(str: string) : boolean {
    let path = str;
    try {
        path = new URL(str).pathname;
    } catch {
        // Keep raw path for relative links that are not valid URLs.
    }

    return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(path);
}

export interface Dictionary<T> {
    [key: string]: T;
}

export interface Size {
    width: number;
    height: number;
}