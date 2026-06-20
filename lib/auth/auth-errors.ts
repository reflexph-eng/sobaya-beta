export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue. Veuillez réessayer.";
}
