"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Building2,
  Shield,
  CreditCard,
  ArrowRight,
  Menu,
  X,
  Percent,
  Wallet,
  Lock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Award,
} from "lucide-react";
import { useI18n } from "./components/LanguageProvider";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { Logo } from "./components/Logo";

export default function HomePage() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const promoRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const HERO_SLIDES = [
    { titleKey: "hero1Title", subtitleKey: "hero1Subtitle", ctaKey: "hero1Cta", href: "/register", icon: Sparkles },
    { titleKey: "hero2Title", subtitleKey: "hero2Subtitle", ctaKey: "hero2Cta", href: "#about", icon: Shield },
    { titleKey: "hero3Title", subtitleKey: "hero3Subtitle", ctaKey: "hero3Cta", href: "/login", icon: Zap },
  ];

  const STATS = [
    { value: "2M+", labelKey: "statClients" },
    { value: "99.9%", labelKey: "statUptime" },
    { value: "24/7", labelKey: "statSupport" },
  ];

  const PROMOS = [
    { id: "1", titleKey: "promo1Title", descKey: "promo1Desc", badgeKey: "promo1Badge", gradient: "from-emerald-500/20 to-teal-600/10", icon: Percent, image: "/images/hero-glow.png" },
    { id: "2", titleKey: "promo2Title", descKey: "promo2Desc", badgeKey: "promo2Badge", gradient: "from-amber-500/20 to-orange-600/10", icon: Wallet, image: "/images/services-visual.png" },
    { id: "3", titleKey: "promo3Title", descKey: "promo3Desc", badgeKey: "promo3Badge", gradient: "from-violet-500/20 to-purple-600/10", icon: Award, image: "/images/trust-badge.png" },
    { id: "4", titleKey: "promo4Title", descKey: "promo4Desc", badgeKey: "promo4Badge", gradient: "from-cyan-500/20 to-blue-600/10", icon: Lock, image: "/images/about-bank.png" },
  ];

  const SERVICES = [
    { titleKey: "service1Title", descKey: "service1Desc", icon: CreditCard, image: "/images/services-visual.png" },
    { titleKey: "service2Title", descKey: "service2Desc", icon: Building2, image: "/images/about-bank.png" },
    { titleKey: "service3Title", descKey: "service3Desc", icon: Shield, image: "/images/trust-badge.png" },
  ];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, [HERO_SLIDES.length]);

  useEffect(() => {
    const closeOnResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", closeOnClickOutside);
    return () => document.removeEventListener("click", closeOnClickOutside);
  }, [menuOpen]);

  const scrollPromo = (dir: "l" | "r") => {
    if (!promoRef.current) return;
    const w = promoRef.current.offsetWidth;
    promoRef.current.scrollBy({ left: dir === "r" ? w * 0.8 : -w * 0.8, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header ref={headerRef} className="border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between gap-3 h-14 sm:min-h-[72px]">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 font-semibold text-lg sm:text-xl shrink-0 min-w-0">
            <Logo variant="full" className="truncate" />
          </Link>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
          </div>

          <button
            type="button"
            className="md:hidden p-2.5 -mr-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg touch-manipulation"
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            aria-label={t("ariaMenu")}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <nav
            id="main-nav"
            className={`absolute md:static top-full left-0 right-0 bg-[var(--bg-card)] md:bg-transparent border-b md:border-0 border-[var(--border)] shadow-lg md:shadow-none ${
              menuOpen ? "block" : "hidden md:flex"
            }`}
          >
            <ul className="container flex flex-col md:flex-row md:items-center md:gap-1 py-3 md:py-0 gap-0">
              <li>
                <Link href="#services" className="block py-3 px-4 md:py-2 md:px-3 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] touch-manipulation" onClick={() => setMenuOpen(false)}>{t("navServices")}</Link>
              </li>
              <li>
                <Link href="#promos" className="block py-3 px-4 md:py-2 md:px-3 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] touch-manipulation" onClick={() => setMenuOpen(false)}>{t("navPromos")}</Link>
              </li>
              <li>
                <Link href="#about" className="block py-3 px-4 md:py-2 md:px-3 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] touch-manipulation" onClick={() => setMenuOpen(false)}>{t("navAbout")}</Link>
              </li>
              <li className="mt-1 md:mt-0 md:ml-4 flex flex-col sm:flex-row gap-1 md:gap-2 items-stretch md:items-center border-t md:border-0 border-[var(--border)] pt-3 md:pt-0">
                <span className="md:hidden px-4 py-2"><LanguageSwitcher /></span>
                <Link href="/login" className="block py-3 px-4 md:py-2 md:px-4 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] font-medium touch-manipulation" onClick={() => setMenuOpen(false)}>{t("navLogin")}</Link>
                <Link href="/register" className="btn btn-primary mx-4 md:mx-0 py-3 md:py-2 text-center touch-manipulation" onClick={() => setMenuOpen(false)}>{t("navRegister")}</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative hero-mesh pt-12 md:pt-20 pb-16 md:pb-24 overflow-hidden">
          <img src="/images/hero-glow.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" aria-hidden />
          <div className="orb orb-teal w-[400px] h-[400px] -top-32 -right-32 animate-pulse-glow" />
          <div className="orb orb-amber w-[280px] h-[280px] top-1/2 -left-24 animate-float-slow" />
          <div className="orb orb-blue w-[200px] h-[200px] bottom-20 right-1/3 animate-float" />
          <div className="container relative z-10">
            <div className="max-w-3xl animate-fade-in-up">
              {HERO_SLIDES.map((slide, i) => (
                <div
                  key={i}
                  className={`transition-opacity duration-500 ${i === heroIndex ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <span className="section-label">{t("heroLabel")}</span>
                    <slide.icon className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
                    {t(slide.titleKey)}
                  </h1>
                  <p className="text-lg md:text-xl text-[var(--text-muted)] mb-10 max-w-xl">
                    {t(slide.subtitleKey)}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href={slide.href} className="btn btn-primary text-lg px-8 py-4 rounded-xl shine-hover">
                      {t(slide.ctaKey)} <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link href="#services" className="btn btn-secondary text-lg px-8 py-4 rounded-xl">
                      {t("heroCtaServices")}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="carousel-dots mt-12">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${t("ariaSlide")} ${i + 1}`}
                  className={`carousel-dot ${i === heroIndex ? "active" : ""}`}
                  onClick={() => setHeroIndex(i)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] py-8 md:py-10 bg-gradient-to-b from-[var(--bg)] via-[var(--bg-elevated)]/40 to-[var(--bg)] section-dots relative">
          <div className="absolute top-4 right-4 w-32 h-16 md:w-48 md:h-24 opacity-30 pointer-events-none">
            <img src="/images/trust-badge.png" alt="" className="w-full h-full object-contain" aria-hidden />
          </div>
          <div className="container relative z-10">
            <div className="grid grid-cols-3 gap-8 text-center">
              {STATS.map((stat, i) => (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--accent)] to-emerald-400 bg-clip-text text-transparent mono">{stat.value}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{t(stat.labelKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="py-[var(--section-padding)] section-dots relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[min(400px,50vw)] h-64 opacity-20 pointer-events-none hidden lg:block">
            <img src="/images/services-visual.png" alt="" className="w-full h-full object-contain object-right" aria-hidden />
          </div>
          <div className="container relative z-10">
            <p className="section-label animate-fade-in-up">{t("sectionServices")}</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>{t("sectionServicesTitle")}</h2>
            <p className="text-[var(--text-muted)] max-w-xl mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {t("sectionServicesDesc")}
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              {SERVICES.map((s, i) => (
                <Link key={i} href="/register" className="premium-card group block animate-scale-in card-hover-lift" style={{ animationDelay: `${0.15 + i * 0.08}s`, opacity: 0 }}>
                  <div className="aspect-[4/3] bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)] flex items-center justify-center relative overflow-hidden">
                    <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 image-zoom-hover transition-opacity duration-300" aria-hidden />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-card)]/80 via-transparent to-[var(--bg-card)]/60 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <s.icon className="w-16 h-16 text-[var(--accent)]/90 relative z-10 icon-bounce-hover transition-transform" />
                  </div>
                  <div className="p-6 relative z-10">
                    <h3 className="font-semibold text-lg mb-2">{t(s.titleKey)}</h3>
                    <p className="text-[var(--text-muted)] text-sm leading-relaxed">{t(s.descKey)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="promos" className="py-[var(--section-padding)] border-t border-[var(--border)] section-dots bg-gradient-to-b from-[var(--bg)] via-[var(--bg-card)]/50 to-[var(--bg)]">
          <div className="container">
            <p className="section-label">{t("sectionPromos")}</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t("promosSubtitle")}</h2>
            <p className="text-[var(--text-muted)] mb-8">{t("promosDesc")}</p>

            <div className="relative">
              <button
                type="button"
                onClick={() => scrollPromo("l")}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] shadow-lg"
                aria-label={t("ariaPrev")}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                type="button"
                onClick={() => scrollPromo("r")}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-12 h-12 rounded-full bg-[var(--bg-card)] border border-[var(--border)] items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] shadow-lg"
                aria-label={t("ariaNext")}
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div ref={promoRef} className="swipe-track">
                {PROMOS.map((promo, i) => (
                  <div key={promo.id} className="swipe-slide w-[min(320px,85vw)]">
                    <div className={`premium-card h-full overflow-hidden p-0 bg-gradient-to-br ${promo.gradient} border border-[var(--border-subtle)] animate-scale-in card-hover-lift group/promo`} style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
                      <div className="h-28 relative overflow-hidden">
                        <img src={promo.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover/promo:opacity-60 group-hover/promo:scale-105 transition-all duration-500" aria-hidden />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)]/90 to-transparent" />
                        <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">{t(promo.badgeKey)}</span>
                          <promo.icon className="w-10 h-10 text-[var(--accent)]/80 icon-bounce-hover" />
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-semibold text-lg mb-2">{t(promo.titleKey)}</h3>
                        <p className="text-[var(--text-muted)] text-sm mb-6">{t(promo.descKey)}</p>
                        <Link href="/register" className="text-[var(--accent)] font-medium text-sm inline-flex items-center gap-1 hover:gap-2 transition-all group/link">
                          {t("readMore")} <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-[var(--section-padding)] border-t border-[var(--border)] section-dots relative">
          <div className="orb orb-teal w-[300px] h-[300px] -bottom-20 -right-20 opacity-40 animate-float-slow" />
          <div className="container relative z-10">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <p className="section-label">{t("sectionAbout")}</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("sectionAboutTitle")}</h2>
                <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                  {t("bankName")} — {t("aboutParagraph")}
                </p>
                <ul className="space-y-3 text-[var(--text-muted)]">
                  <li className="flex items-center gap-2"><Shield className="w-5 h-5 text-[var(--accent)] shrink-0" /> {t("aboutItem1")}</li>
                  <li className="flex items-center gap-2"><Zap className="w-5 h-5 text-[var(--accent)] shrink-0" /> {t("aboutItem2")}</li>
                  <li className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[var(--accent)] shrink-0" /> {t("aboutItem3")}</li>
                </ul>
              </div>
              <div className="relative rounded-[var(--radius-xl)] overflow-hidden aspect-[4/3] bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-card)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)]">
                <img
                  src="/images/about-bank.png"
                  alt="ČSOB Asia"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 max-w-sm aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-[#1a2332] via-[#0f1620] to-[#0a0e14] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col p-6 animate-float">
                    <div className="w-10 h-8 rounded bg-gradient-to-br from-[var(--gold)] to-amber-700 mb-6" />
                    <div className="font-mono text-lg tracking-widest text-white/90 mb-4">•••• •••• •••• 4242</div>
                    <div className="mt-auto flex justify-between text-sm text-white/50">
                      <span>ČSOB ASIA</span>
                      <span>12/28</span>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)]/50 via-transparent to-[var(--bg)]/30 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-[var(--section-padding)] border-t border-[var(--border)] relative overflow-hidden">
          <div className="orb orb-teal w-[350px] h-[350px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
          <div className="orb orb-amber w-[200px] h-[200px] top-0 right-1/4 animate-float" />
          <div className="container text-center relative z-10">
            <div className="max-w-2xl mx-auto rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent)]/25 via-emerald-900/20 to-[var(--accent)]/15 border border-[var(--accent)]/30 p-10 md:p-14 shadow-[var(--shadow-glow)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,200,150,0.12),transparent)] pointer-events-none" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 relative">{t("ctaTitle")}</h2>
              <p className="text-[var(--text-muted)] mb-8 relative">{t("ctaSubtitle")}</p>
              <div className="flex flex-wrap gap-4 justify-center relative">
                <Link href="/register" className="btn btn-primary text-lg px-8 py-4 rounded-xl shine-hover">
                  {t("ctaOpenAccount")} <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="btn btn-secondary text-lg px-8 py-4 rounded-xl">
                  {t("ctaLoginToCabinet")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--bg-card)] section-dots">
        <div className="container py-12 md:py-16 relative z-10">
          <div className="grid md:grid-cols-4 gap-10 md:gap-8">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 font-semibold text-xl mb-4">
                <Logo variant="full" />
              </Link>
              <p className="text-[var(--text-muted)] text-sm max-w-sm">
                {t("footerTagline")}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-4">{t("footerNav")}</h4>
              <ul className="space-y-2">
                <li><Link href="#services" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">{t("navServices")}</Link></li>
                <li><Link href="#promos" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">{t("navPromos")}</Link></li>
                <li><Link href="#about" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">{t("navAbout")}</Link></li>
                <li><Link href="/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">{t("navLogin")}</Link></li>
                <li><Link href="/register" className="text-sm text-[var(--accent)] hover:underline">{t("navRegister")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[var(--text-muted)] uppercase tracking-wider mb-4">{t("footerContacts")}</h4>
              <p className="text-sm text-[var(--text-muted)]">{t("footerSupport")}</p>
              <a href="mailto:info@asiacsb.online" className="text-sm text-[var(--accent)] hover:underline mt-1 inline-block">info@asiacsb.online</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-subtle)]">© {mounted ? new Date().getFullYear() : ""} {t("bankName")}. {t("footerRights")}.</p>
            <div className="flex gap-6 text-sm text-[var(--text-subtle)]">
              <Link href="#" className="hover:text-[var(--text)]">{t("footerPrivacy")}</Link>
              <Link href="#" className="hover:text-[var(--text)]">{t("footerTerms")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
