"use client";

export function DemoSection() {
  return (
    <section id="demo" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              See it in action
            </h2>
            <p className="text-lg text-muted-foreground">
              Watch how Sift seamlessly adds IMDB ratings to your favorite
              streaming platforms
            </p>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/0nacMtjRhk4?rel=0"
                title="Sift Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
