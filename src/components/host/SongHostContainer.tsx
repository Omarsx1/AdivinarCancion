import { useEffect, useMemo, useRef, useState } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { MIN_SONGS, useSongHost } from '../../hooks/useSongHost';
import { buildPlayerUrl } from '../../lib/roomCode';
import { AdminPanel } from './AdminPanel';
import { HostHeader } from './HostHeader';
import { NowPlaying } from './NowPlaying';
import { StageLobby } from './StageLobby';

interface SongHostContainerProps {
  initialCode?: string;
}

export function SongHostContainer({ initialCode }: SongHostContainerProps) {
  const host = useSongHost(initialCode);
  const timer = useCountdown(host.timer, null);
  const [adminOpen, setAdminOpen] = useState(true);
  const bundledLoaded = useRef(false);

  useEffect(() => {
    if (bundledLoaded.current) return;
    bundledLoaded.current = true;
    void host.loadBundledSongs();
  }, [host.loadBundledSongs]);

  const playerUrl = useMemo(() => {
    const configured = (import.meta.env.PUBLIC_PLAY_ORIGIN ?? '').trim();
    const origin =
      configured.length > 0
        ? configured
        : typeof window === 'undefined'
          ? ''
          : window.location.origin;
    return buildPlayerUrl(origin, host.roomCode);
  }, [host.roomCode]);

  const playerUrlIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(playerUrl);

  const paused = host.phase === 'clip' && host.timer.endsAt === null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col gap-4 overflow-x-hidden p-4 sm:p-6 xl:h-dvh">
      <HostHeader
        roomCode={host.roomCode}
        playerCount={host.players.length}
        connection={host.connection}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <main className="min-h-0 flex-1">
        {host.phase === 'lobby' ? (
          <StageLobby
            roomCode={host.roomCode}
            playerUrl={playerUrl}
            playerCount={host.players.length}
            songsCount={host.songs.length}
            canStart={host.canStart}
            minSongs={MIN_SONGS}
            configError={host.configError}
            audioError={host.audioError}
            onOpenAdmin={() => setAdminOpen(true)}
            onStart={host.startGame}
            onDismissError={host.dismissAudioError}
          />
        ) : (
          <NowPlaying
            phase={host.phase}
            songNumber={host.currentIndex + 1}
            songTotal={host.songs.length}
            options={host.options}
            answerCount={host.answerCount}
            playerCount={host.players.length}
            timer={timer}
            paused={paused}
            reveal={host.reveal}
            standings={host.standings}
            currentSong={host.currentSong}
            audioError={host.audioError}
            onPause={host.pauseClip}
            onResume={host.resumeClip}
            onReveal={host.revealNow}
            onShowRanking={host.showRanking}
            onNextSong={host.nextSong}
            onReset={host.resetGame}
            onSeek={host.seek}
            onDismissError={host.dismissAudioError}
          />
        )}
      </main>

      {adminOpen && (
        <AdminPanel
          roomCode={host.roomCode}
          playerUrl={playerUrl}
          playerUrlIsLocal={playerUrlIsLocal}
          playerCount={host.players.length}
          connection={host.connection}
          configError={host.configError}
          audioError={host.audioError}
          songs={host.songs}
          currentIndex={host.currentIndex}
          phase={host.phase}
          canStart={host.canStart}
          minSongs={MIN_SONGS}
          clipSeconds={Math.round(host.clipMs / 1000)}
          answerSeconds={Math.round(host.answerMs / 1000)}
          volume={host.volume}
          onClipSeconds={host.setClipSeconds}
          onAnswerSeconds={host.setAnswerSeconds}
          onVolume={host.setVolume}
          onAddFiles={host.addFiles}
          onUpdate={host.updateSong}
          onRemove={host.removeSong}
          onMove={host.moveSong}
          onPlay={host.playSongAt}
          onStart={() => {
            host.startGame();
            setAdminOpen(false);
          }}
          onClose={() => setAdminOpen(false)}
          onDismissError={host.dismissAudioError}
        />
      )}
    </div>
  );
}
