export interface YouTubeVideo {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
}

async function getChannelId(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/${handle}`);
    const html = await res.text();
    const match = html.match(/"channelId":"([^"]+)"/) || html.match(/channel_id=([^"&]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function getLatestVideos(handle: string, count: number = 3): Promise<YouTubeVideo[]> {
  try {
    const channelId = await getChannelId(handle);
    if (!channelId) return [];

    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const res = await fetch(feedUrl);
    const xml = await res.text();

    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

    return entries.slice(0, count).map(entry => {
      const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || '';
      const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || '';
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || '';

      return {
        id,
        title,
        published,
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
      };
    });
  } catch {
    return [];
  }
}
