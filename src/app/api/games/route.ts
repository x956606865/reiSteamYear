import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { getOwnedGames } from "@/lib/steam";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(getAuthOptions(req));

        if (!session || !session.user?.steamId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch both Chinese and English names in parallel
        const [gamesCN, gamesEN] = await Promise.all([
            getOwnedGames(session.user.steamId, 'schinese'),
            getOwnedGames(session.user.steamId, 'english')
        ]);

        // Create a map for English names
        const enNameMap = new Map(gamesEN.map(g => [g.appid, g.name]));

        // Merge EN name into CN list
        const games = gamesCN.map(g => ({
            ...g,
            name_en: enNameMap.get(g.appid) || g.name // Fallback to existing name if missing
        }));

        // Filter games played in the last year (365 days)
        // rtime_last_played is unix timestamp (seconds)
        const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;

        const playedCalculated = games.filter(
            (g) => g.rtime_last_played > oneYearAgo
        );

        // Sort by playtime (descending)
        playedCalculated.sort((a, b) => b.playtime_forever - a.playtime_forever);

        return NextResponse.json({
            games: playedCalculated,
            count: playedCalculated.length,
            total_playtime: playedCalculated.reduce((acc, g) => acc + g.playtime_forever, 0)
        });
    } catch (e) {
        console.error("Games API Error", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
