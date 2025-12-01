"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingTier {
  name: string;
  price: number;
  priceAnnual: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  href: string;
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    price: 0,
    priceAnnual: 0,
    description: "Perfect for exploring and getting started",
    features: [
      "Basic watershed visualization",
      "View stream gauge data",
      "3 saved locations",
      "Public EPA facility data",
      "7-day forecast",
    ],
    cta: "Get Started",
    href: "/register",
  },
  {
    name: "Enthusiast",
    price: 15,
    priceAnnual: 144,
    description: "For outdoor enthusiasts and property owners",
    features: [
      "Everything in Free",
      "Real-time flow data",
      "10 saved locations",
      "Flood and flow alerts",
      "Water quality indicators",
      "Hourly precipitation forecast",
      "Email notifications",
    ],
    cta: "Start Free Trial",
    href: "/register?plan=enthusiast",
  },
  {
    name: "Professional",
    price: 150,
    priceAnnual: 1440,
    description: "For consultants, attorneys, and researchers",
    features: [
      "Everything in Enthusiast",
      "Water rights data",
      "100 saved locations",
      "Historical data access",
      "EPA violation history",
      "Upstream analysis",
      "API access (1,000 calls/mo)",
      "Priority support",
    ],
    highlighted: true,
    cta: "Start Free Trial",
    href: "/register?plan=professional",
  },
  {
    name: "Enterprise",
    price: 500,
    priceAnnual: 4800,
    description: "For organizations and municipalities",
    features: [
      "Everything in Professional",
      "Unlimited locations",
      "Custom integrations",
      "API access (unlimited)",
      "Multi-user accounts",
      "Custom alerts",
      "Data export",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "/contact?plan=enterprise",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="bg-white">
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Start free and upgrade as you need more features. All plans include a 14-day free trial.
          </p>

          <div className="mt-8 inline-flex items-center bg-blue-800/50 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                !annual ? "bg-white text-blue-900" : "text-blue-100 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                annual ? "bg-white text-blue-900" : "text-blue-100 hover:text-white"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border-2 ${
                tier.highlighted
                  ? "border-blue-500 shadow-xl shadow-blue-100 scale-105"
                  : "border-gray-200"
              } bg-white overflow-hidden flex flex-col`}
            >
              {tier.highlighted && (
                <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}

              <div className="p-6 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${annual ? Math.round(tier.priceAnnual / 12) : tier.price}
                  </span>
                  <span className="text-gray-500">/month</span>
                  {annual && tier.price > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      ${tier.priceAnnual}/year (billed annually)
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 pt-0">
                <Link
                  href={tier.href}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                    tier.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: "What data sources do you use?",
                a: "We aggregate data from USGS (stream gauges, watersheds), EPA ECHO (regulated facilities, permits, violations), and NOAA (weather, precipitation forecasts).",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.",
              },
              {
                q: "What's included in the free trial?",
                a: "All paid plans include a 14-day free trial with full access to all features. No credit card required to start.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 30-day money-back guarantee if you're not satisfied with your subscription.",
              },
              {
                q: "What are water rights?",
                a: "Water rights data (Professional plan) includes priority dates, decreed amounts, owner information, and source details for Western US states.",
              },
              {
                q: "Can I upgrade or downgrade?",
                a: "Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the next billing cycle.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-blue-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to explore your watershed?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start with a free account and upgrade when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-900 bg-white rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Explore the Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}