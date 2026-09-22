/**
 * Merveil Songs library for World reels (TikTok-style picker).
 * Catalog uses free/demo streams (SoundHelix) so publish works without a music license stack yet.
 * When music_tracks table is populated, API can replace this list.
 */

export const MERVEIL_SONGS = [
  { id: "mh-1", title: "Desert Pulse", artist: "Merveil Sound", genre: "afrobeat", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "mh-2", title: "Marina Night", artist: "Merveil Sound", genre: "chill", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "mh-3", title: "Burj Drive", artist: "Merveil Sound", genre: "electronic", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "mh-4", title: "Souk Rhythm", artist: "Merveil Sound", genre: "arabic", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "mh-5", title: "Gulf Breeze", artist: "Merveil Sound", genre: "chill", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "mh-6", title: "Arena Heat", artist: "Merveil Sound", genre: "workout", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: "mh-7", title: "Citizen Loop", artist: "Merveil Sound", genre: "hiphop", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: "mh-8", title: "Skyline Jazz", artist: "Merveil Sound", genre: "jazz", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: "mh-9", title: "Island Dub", artist: "Merveil Sound", genre: "reggae", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
  { id: "mh-10", title: "Neon Creek", artist: "Merveil Sound", genre: "electronic", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
  { id: "mh-11", title: "Passport Groove", artist: "Merveil Sound", genre: "afrobeat", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
  { id: "mh-12", title: "Quiet Office", artist: "Merveil Sound", genre: "chill", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
  { id: "mh-13", title: "Late Call", artist: "Merveil Sound", genre: "jazz", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
  { id: "mh-14", title: "Deal Flow", artist: "Merveil Sound", genre: "hiphop", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
  { id: "mh-15", title: "World Open", artist: "Merveil Sound", genre: "electronic", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
  { id: "mh-16", title: "Circle Energy", artist: "Merveil Sound", genre: "workout", duration: 372, preview_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
];

export const MERVEIL_SONG_GENRES = ["all", "afrobeat", "arabic", "chill", "electronic", "hiphop", "jazz", "reggae", "workout"];

export function findMerveilSong(id) {
  if (!id) return null;
  return MERVEIL_SONGS.find((s) => String(s.id) === String(id)) || null;
}

export function filterMerveilSongs(genre = "all", q = "") {
  const query = String(q || "").trim().toLowerCase();
  return MERVEIL_SONGS.filter((s) => {
    if (genre && genre !== "all" && s.genre !== genre) return false;
    if (!query) return true;
    return (
      s.title.toLowerCase().includes(query) ||
      s.artist.toLowerCase().includes(query) ||
      s.genre.toLowerCase().includes(query)
    );
  });
}
