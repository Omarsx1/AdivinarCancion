import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { isValidRoomCode, normalizeRoomCode } from '../../lib/roomCode';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface JoinScreenProps {
  initialCode: string | null;
  configError: string | null;
  onJoin: (code: string, alias: string) => void;
}

export function JoinScreen({ initialCode, configError, onJoin }: JoinScreenProps) {
  const [code, setCode] = useState(initialCode ?? '');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError('Escribe el código de 4 letras que aparece en la pantalla.');
      return;
    }
    if (alias.trim().length === 0) {
      setError('Necesitas un alias para entrar.');
      return;
    }
    setError(null);
    onJoin(normalized, alias);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-5 py-10">
      <header className="space-y-3">
        <p className="poster text-4xl sm:text-5xl">Adivina la canción</p>
        <p className="text-lg text-haze">
          Escucha la pantalla compartida y responde desde tu celular.
        </p>
      </header>

      {configError !== null && (
        <p className="rounded-2xl bg-flamingo px-5 py-4 text-base font-bold text-ink">
          {configError}
        </p>
      )}

      <Card tone="paper" className="p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Código de sala"
            value={code}
            onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
            placeholder="ABCD"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            maxLength={4}
            className="h-16 text-center text-3xl font-black tracking-[0.3em]"
          />
          <Input
            label="Tu alias"
            value={alias}
            onChange={(event) => setAlias(event.target.value.slice(0, 18))}
            placeholder="Ana"
            autoComplete="nickname"
            maxLength={18}
          />

          {error !== null && <p className="text-sm font-bold text-night">{error}</p>}

          <Button type="submit" size="lg" fullWidth disabled={configError !== null}>
            Entrar a la sala
            <ArrowRight size={18} />
          </Button>
        </form>
      </Card>

      <p className="text-sm text-haze">
        El audio sale por la pantalla compartida. Tu celular solo sirve para responder.
      </p>
    </div>
  );
}
