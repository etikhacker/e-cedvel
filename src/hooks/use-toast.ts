export const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title?: string; description?: string; variant?: string }) => {
      // Minimal toast fallback for environments without a toast UI during type-checks
      console.log('toast:', { title, description, variant });
    }
  };
};
