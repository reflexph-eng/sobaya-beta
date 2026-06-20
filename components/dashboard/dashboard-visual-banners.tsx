const VISUALS = {
  banner: "/sobaya-visuals/banner-top.png"
};

export function DashboardVisualBanners() {
  return (
    <section className="sticky top-0 z-10 -mx-1 bg-white/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/80" aria-label="Bannière SOBAYA">
      <div className="overflow-hidden rounded-2xl border border-sobaya-border bg-white shadow-sm">
        <img
          src={VISUALS.banner}
          alt="SOBAYA, votre patrimoine sous contrôle"
          className="h-[72px] w-full object-cover sm:h-[104px] lg:h-[140px]"
          loading="eager"
        />
      </div>
    </section>
  );
}
