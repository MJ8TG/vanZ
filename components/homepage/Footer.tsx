"use client";

import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, MessageCircle } from "lucide-react";

export default function Footer() {
  const t = useTranslations("footer");
  const tServices = useTranslations("services");
  const tCities = useTranslations("cities");
  const locale = useLocale();

  const serviceLinks = ["moving", "furniture", "parcel", "intercity", "office", "express"] as const;
  const cityLinks = ["tunis", "sousse", "sfax", "monastir", "bizerte", "nabeul", "ariana"] as const;

  return (
    <footer className="bg-vanz-navy pt-16 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="inline-block mb-4">
              <Image
                src="/logo-vanz-white.png"
                alt="VanZ"
                width={100}
                height={36}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              {t("tagline")}
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-vanz-teal hover:text-white transition-all duration-200"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-gradient-to-tr hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-200"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/21600000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-green-500 hover:text-white transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t("servicesTitle")}
            </h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((key) => (
                <li key={key}>
                  <Link
                    href={`/${locale}`}
                    className="text-white/50 hover:text-vanz-teal text-sm transition-colors duration-200"
                  >
                    {tServices(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t("citiesTitle")}
            </h4>
            <ul className="space-y-2.5">
              {cityLinks.map((key) => (
                <li key={key}>
                  <Link
                    href={`/${locale}`}
                    className="text-white/50 hover:text-vanz-teal text-sm transition-colors duration-200"
                  >
                    {tCities(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t("companyTitle")}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-white/50 hover:text-vanz-teal text-sm transition-colors duration-200"
                >
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-white/50 hover:text-vanz-teal text-sm transition-colors duration-200"
                >
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-white/50 hover:text-vanz-teal text-sm transition-colors duration-200"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}`}
                  className="text-white/50 hover:text-vanz-teal text-sm transition-colors duration-200"
                >
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-sm">
            {t("copyright")}
          </p>
          <a
            href="https://wa.me/21600000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-full text-sm font-medium transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" />
            {t("whatsapp")}
          </a>
        </div>
      </div>
    </footer>
  );
}
