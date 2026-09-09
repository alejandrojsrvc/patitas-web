export default function AccountLoading() {
  return (
    <div className="mt-7 space-y-4" aria-busy="true" aria-label="Cargando datos de tu cuenta">
      <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
      <div className="h-40 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}
