import { HolocronAnimation } from './HolocronAnimation'

export function LoadingScreen() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 text-center">
      <HolocronAnimation ariaHidden />
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Holocron analyzing...</h2>
        <p className="mt-2 text-sm text-slate-400">
          Calibrating your force signature against the Jedi Archives.
        </p>
      </div>
    </div>
  )
}
