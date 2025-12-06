export interface SteamGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    rtime_last_played: number; // Unix timestamp
    playtime_windows_forever: number;
    playtime_mac_forever: number;
    playtime_linux_forever: number;
}

export async function getOwnedGames(steamId: string): Promise<SteamGame[]> {
    const apiKey = process.env.STEAM_CLIENT_SECRET; // Generally key is same or separate. Using SECRET for now or need STEAM_API_KEY.
    // Note: next-auth-steam uses STEAM_CLIENT_SECRET usually as API Key? Or just for OpenID?
    // Actually usually it is the Web API Key.
    // I'll use STEAM_CLIENT_ID or STEAM_CLIENT_SECRET if that's the key.
    // Standard next-auth-steam setup: clientSecret IS the API Key.

    if (!apiKey) throw new Error("STEAM_CLIENT_SECRET is not set");

    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json&language=schinese`;

    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
        console.error("Failed to fetch steam games", await res.text());
        return [];
    }

    const data = await res.json();
    return data.response?.games || [];
}
