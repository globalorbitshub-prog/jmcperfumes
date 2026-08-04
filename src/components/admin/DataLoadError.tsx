export function DataLoadError({ message }: { message?: string }) {
  return (
    <div className="bg-error/10 border border-error rounded p-4 text-sm text-primary">
      <p className="font-medium text-error mb-1">No se pudieron cargar los datos.</p>
      <p className="text-primary/70">
        {message || "Hubo un problema de conexión con la base de datos."} Recarga la página; si el problema
        continúa, prueba de nuevo en unos minutos.
      </p>
    </div>
  );
}
