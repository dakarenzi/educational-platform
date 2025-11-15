import { BrainCircuit } from 'lucide-react';
export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 flex flex-col items-center justify-center text-center min-h-[calc(100vh-200px)]">
        <BrainCircuit className="h-24 w-24 text-primary mb-6" />
        <h1 className="text-4xl font-bold font-display text-foreground">Analytics</h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl">
          This feature is coming soon! Track student progress, course engagement, and quiz performance.
        </p>
      </div>
    </div>
  );
}