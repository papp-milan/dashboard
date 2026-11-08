
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Radio,
    Play,
    Pause,
    Volume2,
    VolumeX,
    ExternalLink,
    RadioTower,
} from "lucide-react"

const STREAM_URL = "https://ice1.somafm.com/groovesalad-128-mp3";
const METADATA_URL = "https://somafm.com/songs/groovesalad.json";

type Track = {
    title: string
    artist: string
}

function getTrack(data: unknown): Track | null {
    if (!data || typeof data !== "object") return null

    const payload = data as Record<string, unknown>
    const songs = Array.isArray(payload.songs) ? payload.songs : []
    const current = (songs[0] ?? payload) as Record<string, unknown>

    const title = current.title ?? current.Song ?? current.song
    const artist = current.artist ?? current.Artist

    if (typeof title !== "string") return null

    return {
        title,
        artist: typeof artist === "string" ? artist : "SomaFM",
    }
}

export function RadioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [volume, setVolume] = useState(65)
    const [track, setTrack] = useState<Track>({
        title: "Groove Salad",
        artist: "SomaFM · Ambient / Downtempo",
    })
    const [error, setError] = useState<string | null>(null)

    const fetchMetadata = useCallback(async () => {
        try {
            const response = await fetch(METADATA_URL, {
                cache: "no-store",
            })

            if (!response.ok) return

            const data: unknown = await response.json()
            const currentTrack = getTrack(data)

            if (currentTrack) {
                setTrack(currentTrack)
            }
        } catch {
            // Metadata is optional. Audio playback can continue.
        }
    }, [])

    useEffect(() => {
        void fetchMetadata()

        const interval = window.setInterval(fetchMetadata, 30_000)
        return () => window.clearInterval(interval)
    }, [fetchMetadata])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100
        }
    }, [volume])

    const togglePlayback = async () => {
        const audio = audioRef.current
        if (!audio) return

        if (!audio.paused) {
            audio.pause()
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            audio.load()
            await audio.play()
        } catch (error) {
            console.error("Radio playback failed:", error)

            setError(
                error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : "Unbekannter Wiedergabefehler"
            )

            setIsPlaying(false)
            setIsLoading(false)
        }
    }

    const handleVolumeChange = (value: number) => {
        setVolume(value)

        if (audioRef.current) {
            audioRef.current.volume = value / 100
        }
    }

    return (
        <section className="w-full max-w-md rounded-2xl border border-white/15 bg-black/35 p-5 text-white shadow-xl backdrop-blur-xl">
            <audio
                ref={audioRef}
                src={STREAM_URL}
                preload="none"
                onPlay={() => {
                    setIsPlaying(true)
                    setError(null)
                }}
                onPause={() => setIsPlaying(false)}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => {
                    setIsLoading(false)
                    setIsPlaying(true)
                }}
                onError={(event) => {
                    const audio = event.currentTarget
                    const mediaError = audio.error

                    console.error("Radio error:", {
                        code: mediaError?.code,
                        message: mediaError?.message,
                        networkState: audio.networkState,
                        readyState: audio.readyState,
                        currentSrc: audio.currentSrc,
                    })

                    setIsPlaying(false)
                    setIsLoading(false)
                    setError(
                        `Fehler ${mediaError?.code ?? "unbekannt"}: ${
                            mediaError?.message ?? "Audio konnte nicht geladen werden."
                        }`
                    )
                }}
            />

            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-white/80" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                        Radio
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`h-2 w-2 rounded-full ${
                            isPlaying
                                ? "animate-pulse bg-green-400"
                                : "bg-white/30"
                        }`}
                    />
                    <span className="text-xs text-white/60">
                        {isPlaying ? "LIVE" : "OFFLINE"}
                    </span>
                </div>
            </div>

            {/* Track information */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                    <RadioTower className="h-7 w-7 text-white/80" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-white/50">
                        NOW PLAYING
                    </p>

                    <h3 className="truncate text-lg font-semibold">
                        {track.title}
                    </h3>

                    <p className="truncate text-sm text-white/60">
                        {track.artist}
                    </p>
                </div>
            </div>

            {/* Live timeline */}
            <div className="mb-5">
                <div className="relative h-1.5 overflow-hidden rounded-full bg-white/15">
                    {isPlaying && (
                        <div className="absolute inset-y-0 left-0 w-1/3 animate-[live-progress_3s_ease-in-out_infinite_alternate] rounded-full bg-white/90" />
                    )}
                </div>

                <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-white/45">
                    <span>Live broadcast</span>
                    <span>Real time</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={togglePlayback}
                        disabled={isLoading}
                        aria-label={isPlaying ? "Pause radio" : "Play radio"}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-white/85 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                        ) : isPlaying ? (
                            <Pause className="h-5 w-5 fill-current" />
                        ) : (
                            <Play className="ml-0.5 h-5 w-5 fill-current" />
                        )}
                    </button>

                    <span className="text-sm font-medium text-white/80">
                        {isLoading
                            ? "Connecting..."
                            : isPlaying
                                ? "Playing"
                                : "Start listening"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            handleVolumeChange(volume === 0 ? 65 : 0)
                        }
                        aria-label={volume === 0 ? "Unmute" : "Mute"}
                        className="text-white/70 transition hover:text-white"
                    >
                        {volume === 0 ? (
                            <VolumeX className="h-5 w-5" />
                        ) : (
                            <Volume2 className="h-5 w-5" />
                        )}
                    </button>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(event) =>
                            handleVolumeChange(Number(event.target.value))
                        }
                        aria-label="Volume"
                        className="h-1 w-20 cursor-pointer accent-white"
                    />
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3">
                    <p className="text-xs text-red-300">
                        {error}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-white/40">
                    Powered by SomaFM
                </span>

                <a
                    href="https://somafm.com/groovesalad/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-white/60 transition hover:text-white"
                >
                    Station info
                    <ExternalLink className="h-3 w-3" />
                </a>
            </div>
        </section>
    )
}
