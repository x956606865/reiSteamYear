export interface SteamGame {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
    rtime_last_played: number; // Unix timestamp
    playtime_windows_forever: number;
    playtime_mac_forever: number;
    playtime_linux_forever: number;
    name_en?: string;
}

export async function getOwnedGames(steamId: string, language: string = 'schinese'): Promise<SteamGame[]> {
    const apiKey = process.env.STEAM_CLIENT_SECRET;

    if (!apiKey) throw new Error("STEAM_CLIENT_SECRET is not set");

    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json&language=${language}`;

    // Revalidate 1 hour. Note: distinct cache keys per language would be needed if we were caching strictly by URL (fetch does this auto)
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
        console.error(`Failed to fetch steam games (${language})`, await res.text());
        return [];
    }

    const data = await res.json();
    return data.response?.games || [];
}
